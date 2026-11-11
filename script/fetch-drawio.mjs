/**
 * Installs the pinned draw.io web app into public/drawio.
 *
 * The editor is served from our own origin because reading its selection needs direct access to
 * the iframe; the public embed.diagrams.net is cross-origin and only speaks postMessage.
 * Runs before `dev` and `build`, and does nothing when the pinned version is already installed.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { log, serializeError } from '../backend/src/infrastructure/logger.mjs';

// NOTE: Pinned because the selection bridge relies on draw.io internals; bump deliberately.
const DRAWIO_VERSION = 'v32.0.2';
const DRAWIO_SHA256 = '3cb8abec8e9bfc7504760c9cdc9194ecf7e8de178aa2a1d668801c32ecf1a1a7';
const DRAWIO_DOWNLOAD_URL = `https://github.com/jgraph/drawio/releases/download/${DRAWIO_VERSION}/draw.war`;

const MODULE = 'FetchDrawio';
const TARGET_DIRECTORY = fileURLToPath(new URL('../public/drawio', import.meta.url));
const VERSION_STAMP_FILE = join(TARGET_DIRECTORY, '.version');
// Server-side parts of the .war that a static copy does not need.
const SKIPPED_ARCHIVE_PREFIXES = ['WEB-INF/', 'META-INF/'];

function readInstalledVersion() {
  try {
    return readFileSync(VERSION_STAMP_FILE, 'utf8').trim();
  } catch {
    return null;
  }
}

async function downloadVerifiedArchive() {
  const response = await fetch(DRAWIO_DOWNLOAD_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${DRAWIO_DOWNLOAD_URL}`);
  const archive = Buffer.from(await response.arrayBuffer());
  // The copy runs with our origin's privileges, so it must be the exact release.
  const checksum = createHash('sha256').update(archive).digest('hex');
  if (checksum !== DRAWIO_SHA256) throw new Error(`draw.war checksum mismatch (got ${checksum})`);
  return archive;
}

/** Yields the files of a zip archive (a .war is one); supports the stored and deflate methods only. */
function* readZipEntries(archive) {
  const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
  const CENTRAL_DIRECTORY_ENTRY_SIGNATURE = 0x02014b50;
  // The end record sits in the last 22 bytes plus an optional comment of up to 64 KiB.
  let endRecordOffset = -1;
  for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 65557); offset--) {
    if (archive.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      endRecordOffset = offset;
      break;
    }
  }
  if (endRecordOffset < 0) throw new Error('Not a zip file: end record not found');

  const entryCount = archive.readUInt16LE(endRecordOffset + 10);
  let offset = archive.readUInt32LE(endRecordOffset + 16);
  for (let index = 0; index < entryCount; index++) {
    if (archive.readUInt32LE(offset) !== CENTRAL_DIRECTORY_ENTRY_SIGNATURE) throw new Error('Corrupt zip central directory');
    const method = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localHeaderOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString('utf8', offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith('/')) continue;

    const localNameLength = archive.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = archive.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = archive.subarray(dataStart, dataStart + compressedSize);
    if (method !== 0 && method !== 8) throw new Error(`Unsupported zip compression ${method} (${name})`);
    yield { name, content: method === 8 ? inflateRawSync(compressed) : compressed };
  }
}

/** The version stamp is written last, so an interrupted install is redone on the next run. */
function installArchive(archive) {
  rmSync(TARGET_DIRECTORY, { recursive: true, force: true });
  let fileCount = 0;
  for (const { name, content } of readZipEntries(archive)) {
    if (SKIPPED_ARCHIVE_PREFIXES.some(prefix => name.startsWith(prefix))) continue;
    const filePath = join(TARGET_DIRECTORY, name);
    if (!filePath.startsWith(TARGET_DIRECTORY + sep)) throw new Error(`Unsafe path in archive: ${name}`);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
    fileCount++;
  }
  writeFileSync(VERSION_STAMP_FILE, `${DRAWIO_VERSION}
`);
  return fileCount;
}

async function main() {
  if (readInstalledVersion() === DRAWIO_VERSION) return;
  log('info', MODULE, 'Downloading draw.io', { version: DRAWIO_VERSION });
  let archive;
  try {
    archive = await downloadVerifiedArchive();
  } catch (error) {
    if (existsSync(join(TARGET_DIRECTORY, 'index.html'))) {
      log('warn', MODULE, 'Download failed; keeping the installed copy', { error: serializeError(error) });
      return;
    }
    throw error;
  }
  const fileCount = installArchive(archive);
  log('info', MODULE, 'draw.io installed', { version: DRAWIO_VERSION, fileCount, directory: TARGET_DIRECTORY });
}

main().catch(error => {
  log('error', MODULE, 'draw.io install failed; the diagram canvas needs it', { error: serializeError(error) });
  process.exitCode = 1;
});

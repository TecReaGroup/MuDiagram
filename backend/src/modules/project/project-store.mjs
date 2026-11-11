import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { appConfig } from '../../config/app-config.mjs';
import { HttpError } from '../../shared/http-error.mjs';

const PROJECT_META_FILE = 'project.json';
const SHARE_TOKEN_BYTES = 24;
const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_DIAGRAM_XML = '<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';

/** The stored renditions of a project's diagram, keyed by the extension used in URLs. */
export const DIAGRAM_RENDITIONS = {
  drawio: { fileName: 'diagram.drawio', contentType: 'application/vnd.jgraph.mxfile; charset=utf-8' },
  svg: { fileName: 'diagram.svg', contentType: 'image/svg+xml' },
  png: { fileName: 'diagram.png', contentType: 'image/png' },
};

const projectRoot = appConfig.storage.projectRoot;
const trashRetentionMs = appConfig.trash.retentionDays * DAY_MS;
const projectLocks = new Map();
// project.json is written only by this process, so a parsed copy stays valid until the next write.
// Listing the library used to re-read and re-parse every project.json on each request.
const projectMetaCache = new Map();

export function projectDirectory(projectId) {
  return join(projectRoot, projectId);
}

// Readers never see a half-written file: write beside it, then rename over it.
export async function writeFileAtomically(filePath, content) {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, content);
  await rename(temporaryPath, filePath);
}

// Autosave and rename/share requests race on project.json; serialize them per project.
async function withProjectLock(projectId, operation) {
  const previous = projectLocks.get(projectId) ?? Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  projectLocks.set(projectId, current);
  try {
    return await current;
  } finally {
    if (projectLocks.get(projectId) === current) projectLocks.delete(projectId);
  }
}

// Projects saved before `diagramSavedAt` existed: the SVG snapshot's mtime is when it was last saved.
async function readLegacyDiagramSavedAt(projectId) {
  try {
    return (await stat(join(projectDirectory(projectId), DIAGRAM_RENDITIONS.svg.fileName))).mtime.toISOString();
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

// Fills fields added after the first release so older project.json files read like new ones.
async function normalizeProjectMeta(project) {
  const diagramSavedAt = project.diagramSavedAt === undefined ? await readLegacyDiagramSavedAt(project.id) : project.diagramSavedAt;
  return { folderId: null, trashedAt: null, ...project, diagramSavedAt };
}

async function readProjectMeta(projectId) {
  const cached = projectMetaCache.get(projectId);
  if (cached) return cached;
  let project;
  try {
    project = JSON.parse(await readFile(join(projectDirectory(projectId), PROJECT_META_FILE), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new HttpError(404, 'Project not found');
    throw error;
  }
  const normalized = await normalizeProjectMeta(project);
  // Reads take no lock: a write that finished while this read was in flight is newer, so it wins.
  if (!projectMetaCache.has(projectId)) projectMetaCache.set(projectId, normalized);
  return projectMetaCache.get(projectId);
}

async function writeProjectMeta(project) {
  await writeFileAtomically(join(projectDirectory(project.id), PROJECT_META_FILE), JSON.stringify(project, null, 2));
  projectMetaCache.set(project.id, project);
}

async function updateProjectMeta(projectId, applyChange) {
  return withProjectLock(projectId, async () => {
    const project = applyChange(await readProjectMeta(projectId));
    await writeProjectMeta(project);
    return project;
  });
}

async function readAllProjects() {
  await mkdir(projectRoot, { recursive: true });
  const entries = await readdir(projectRoot, { withFileTypes: true });
  const projects = await Promise.all(entries
    .filter(entry => entry.isDirectory())
    .map(entry => readProjectMeta(entry.name).catch(() => null)));
  return projects.filter(Boolean);
}

function isTrashed(project) {
  return project.trashedAt !== null;
}

function withPurgeTime(project) {
  return { ...project, purgeAt: new Date(Date.parse(project.trashedAt) + trashRetentionMs).toISOString() };
}

/** Projects outside the trash, most recently updated first. */
export async function listProjects() {
  return (await readAllProjects())
    .filter(project => !isTrashed(project))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

/** Trashed projects with the time they will be purged, most recently trashed first. */
export async function listTrashedProjects() {
  return (await readAllProjects())
    .filter(isTrashed)
    .sort((left, right) => right.trashedAt.localeCompare(left.trashedAt))
    .map(withPurgeTime);
}

export async function createProject(name, folderId) {
  const now = new Date().toISOString();
  const project = { id: randomUUID(), name, folderId, createdAt: now, updatedAt: now, diagramSavedAt: null, shareToken: null, trashedAt: null };
  await mkdir(projectDirectory(project.id), { recursive: true });
  await writeFileAtomically(join(projectDirectory(project.id), DIAGRAM_RENDITIONS.drawio.fileName), EMPTY_DIAGRAM_XML);
  await writeProjectMeta(project);
  return project;
}

export function getProject(projectId) {
  return readProjectMeta(projectId);
}

export function renameProject(projectId, name) {
  return updateProjectMeta(projectId, project => ({ ...project, name, updatedAt: new Date().toISOString() }));
}

/** `folderId` must name an existing folder or be null; the caller validates it. */
export function moveProjectToFolder(projectId, folderId) {
  return updateProjectMeta(projectId, project => ({ ...project, folderId }));
}

/** Clears the folder of every project in it, trashed ones included, so a restore never points at a deleted folder. */
export async function detachProjectsFromFolder(folderId) {
  const projects = (await readAllProjects()).filter(project => project.folderId === folderId);
  await Promise.all(projects.map(project => moveProjectToFolder(project.id, null)));
}

/** Soft delete: the project stays restorable until the trash retention period ends. */
export async function moveProjectToTrash(projectId) {
  const project = await updateProjectMeta(projectId, current => {
    if (isTrashed(current)) throw new HttpError(409, 'Project is already in the trash');
    return { ...current, trashedAt: new Date().toISOString() };
  });
  return withPurgeTime(project);
}

export function restoreProject(projectId) {
  return updateProjectMeta(projectId, project => {
    if (!isTrashed(project)) throw new HttpError(409, 'Project is not in the trash');
    return { ...project, trashedAt: null };
  });
}

/** Only trashed projects can be removed for good, so a single click never destroys live work. */
export function deleteProjectPermanently(projectId) {
  return withProjectLock(projectId, async () => {
    if (!isTrashed(await readProjectMeta(projectId))) throw new HttpError(409, 'Move the project to the trash first');
    await rm(projectDirectory(projectId), { recursive: true, force: true });
    projectMetaCache.delete(projectId);
  });
}

/** Removes trashed projects whose retention period has ended and returns their ids. */
export async function purgeExpiredTrash(now = Date.now()) {
  const expiredProjects = (await listTrashedProjects()).filter(project => Date.parse(project.purgeAt) <= now);
  await Promise.all(expiredProjects.map(project => deleteProjectPermanently(project.id)));
  return expiredProjects.map(project => project.id);
}

/** Stores the diagram together with the SVG/PNG snapshots exported from the same editor state. */
export function saveDiagram(projectId, { xml, svg, png }) {
  return withProjectLock(projectId, async () => {
    const project = await readProjectMeta(projectId);
    const directory = projectDirectory(projectId);
    await Promise.all([
      writeFileAtomically(join(directory, DIAGRAM_RENDITIONS.drawio.fileName), xml),
      writeFileAtomically(join(directory, DIAGRAM_RENDITIONS.svg.fileName), svg),
      writeFileAtomically(join(directory, DIAGRAM_RENDITIONS.png.fileName), png),
    ]);
    const now = new Date().toISOString();
    const savedProject = { ...project, updatedAt: now, diagramSavedAt: now };
    await writeProjectMeta(savedProject);
    return savedProject;
  });
}

export async function readDiagramRendition(projectId, extension) {
  const rendition = DIAGRAM_RENDITIONS[extension];
  await readProjectMeta(projectId);
  try {
    return { contentType: rendition.contentType, content: await readFile(join(projectDirectory(projectId), rendition.fileName)) };
  } catch (error) {
    if (error?.code === 'ENOENT') throw new HttpError(404, 'Diagram has not been saved yet');
    throw error;
  }
}

/** Shares the project; an already shared project keeps its existing link. */
export function enableShare(projectId) {
  return updateProjectMeta(projectId, project => ({
    ...project,
    shareToken: project.shareToken ?? randomBytes(SHARE_TOKEN_BYTES).toString('base64url'),
  }));
}

export function disableShare(projectId) {
  return updateProjectMeta(projectId, project => ({ ...project, shareToken: null }));
}

/** Trashed projects keep their token for a later restore, but their public links stop resolving. */
export async function findProjectByShareToken(shareToken) {
  const projects = await listProjects();
  const project = projects.find(candidate => candidate.shareToken === shareToken);
  if (!project) throw new HttpError(404, 'Shared project not found');
  return project;
}

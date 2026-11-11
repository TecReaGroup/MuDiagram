import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { appConfig } from '../../config/app-config.mjs';
import { HttpError } from '../../shared/http-error.mjs';

const PROJECT_META_FILE = 'project.json';
const SHARE_TOKEN_BYTES = 24;
const EMPTY_DIAGRAM_XML = '<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';

/** The stored renditions of a project's diagram, keyed by the extension used in URLs. */
export const DIAGRAM_RENDITIONS = {
  drawio: { fileName: 'diagram.drawio', contentType: 'application/vnd.jgraph.mxfile; charset=utf-8' },
  svg: { fileName: 'diagram.svg', contentType: 'image/svg+xml' },
  png: { fileName: 'diagram.png', contentType: 'image/png' },
};

const projectRoot = appConfig.storage.projectRoot;
const projectLocks = new Map();

function projectDirectory(projectId) {
  return join(projectRoot, projectId);
}

// Readers never see a half-written file: write beside it, then rename over it.
async function writeFileAtomically(filePath, content) {
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

async function readProjectMeta(projectId) {
  try {
    return JSON.parse(await readFile(join(projectDirectory(projectId), PROJECT_META_FILE), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new HttpError(404, 'Project not found');
    throw error;
  }
}

async function writeProjectMeta(project) {
  await writeFileAtomically(join(projectDirectory(project.id), PROJECT_META_FILE), JSON.stringify(project, null, 2));
}

async function updateProjectMeta(projectId, applyChange) {
  return withProjectLock(projectId, async () => {
    const project = applyChange(await readProjectMeta(projectId));
    await writeProjectMeta(project);
    return project;
  });
}

export async function listProjects() {
  await mkdir(projectRoot, { recursive: true });
  const entries = await readdir(projectRoot, { withFileTypes: true });
  const projects = await Promise.all(entries
    .filter(entry => entry.isDirectory())
    .map(entry => readProjectMeta(entry.name).catch(() => null)));
  return projects
    .filter(Boolean)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function createProject(name) {
  const now = new Date().toISOString();
  const project = { id: randomUUID(), name, createdAt: now, updatedAt: now, shareToken: null };
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

export async function deleteProject(projectId) {
  await readProjectMeta(projectId);
  await withProjectLock(projectId, () => rm(projectDirectory(projectId), { recursive: true, force: true }));
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
    const savedProject = { ...project, updatedAt: new Date().toISOString() };
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

export async function findProjectByShareToken(shareToken) {
  const projects = await listProjects();
  const project = projects.find(candidate => candidate.shareToken === shareToken);
  if (!project) throw new HttpError(404, 'Shared project not found');
  return project;
}

import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { SavedWorkspaceSummary, WorkspaceDocument } from '../types/workspaceDocument.js'
import { appendWorkspaceCheckpoint, mergeWorkspaceHistoryFromDocument } from './workspaceHistoryStore.js'

const workspacesDir = path.resolve(process.cwd(), 'data/workspaces')

function workspacePath(workspaceId: string) {
  const safeId = workspaceId.replace(/[^a-zA-Z0-9:_-]/g, '_')
  return path.join(workspacesDir, `${safeId}.json`)
}

function toSummary(document: WorkspaceDocument): SavedWorkspaceSummary {
  return {
    workspaceId: document.workspaceId,
    name: document.name,
    description: document.description,
    schemaVersion: document.schemaVersion,
    version: document.version,
    updatedAt: document.updatedAt,
    savedAt: document.metadata?.savedAt,
  }
}

async function ensureWorkspaceDir() {
  await mkdir(workspacesDir, { recursive: true })
}

export async function listWorkspaces(): Promise<SavedWorkspaceSummary[]> {
  await ensureWorkspaceDir()
  const entries = await readdir(workspacesDir, { withFileTypes: true })
  const summaries = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const raw = await readFile(path.join(workspacesDir, entry.name), 'utf8')
        return toSummary(JSON.parse(raw) as WorkspaceDocument)
      }),
  )

  return summaries.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export type SaveWorkspaceOptions = {
  rejectStale?: boolean
}

export class StaleWorkspaceVersionError extends Error {
  status = 409
  type = 'schema_error'
  details: string[]

  constructor(incomingVersion: number, storedVersion: number) {
    super(`Workspace update is stale. Incoming version ${incomingVersion} is older than stored version ${storedVersion}.`)
    this.details = [`incoming.version=${incomingVersion}`, `stored.version=${storedVersion}`]
  }
}

export async function saveWorkspace(document: WorkspaceDocument, options: SaveWorkspaceOptions = {}): Promise<SavedWorkspaceSummary> {
  await ensureWorkspaceDir()
  const savedAt = new Date().toISOString()
  const storedDocument = await loadWorkspace(document.workspaceId)
  if (options.rejectStale && storedDocument && document.version < storedDocument.version) {
    throw new StaleWorkspaceVersionError(document.version, storedDocument.version)
  }
  const documentToSave: WorkspaceDocument = {
    ...structuredClone(document),
    version: Math.max(1, document.version),
    updatedAt: savedAt,
    metadata: {
      ...(document.metadata ?? {}),
      source: 'api',
      savedAt,
    },
  }
  const targetPath = workspacePath(documentToSave.workspaceId)
  const tempPath = `${targetPath}.tmp`

  await writeFile(tempPath, JSON.stringify(documentToSave, null, 2), 'utf8')
  await rename(tempPath, targetPath)
  await mergeWorkspaceHistoryFromDocument(documentToSave.workspaceId, documentToSave as unknown as Record<string, unknown>)
  await appendWorkspaceCheckpoint({
    id: `workspace-checkpoint:${crypto.randomUUID()}`,
    workspaceId: documentToSave.workspaceId,
    workspaceVersion: documentToSave.version,
    timestamp: Date.now(),
  })

  return toSummary(documentToSave)
}

export async function loadWorkspace(workspaceId: string): Promise<WorkspaceDocument | undefined> {
  try {
    const raw = await readFile(workspacePath(workspaceId), 'utf8')
    return JSON.parse(raw) as WorkspaceDocument
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await rm(workspacePath(workspaceId), { force: true })
}

export async function workspaceExists(workspaceId: string): Promise<boolean> {
  return Boolean(await loadWorkspace(workspaceId))
}

export async function getWorkspaceVersion(workspaceId: string): Promise<{ workspaceId: string; version: number; updatedAt: string } | undefined> {
  const document = await loadWorkspace(workspaceId)
  if (!document) return undefined
  return {
    workspaceId: document.workspaceId,
    version: document.version,
    updatedAt: document.updatedAt,
  }
}

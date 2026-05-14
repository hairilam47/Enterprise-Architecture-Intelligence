import type { WorkspaceDocument } from './workspaceDocument'

export const CURRENT_SCHEMA_VERSION = 1

export type WorkspaceMigrationResult = {
  document?: WorkspaceDocument
  warnings: string[]
  errors: string[]
}

export function migrateWorkspaceDocument(input: unknown): WorkspaceMigrationResult {
  if (!input || typeof input !== 'object') {
    return { warnings: [], errors: ['Imported workspace is not an object.'] }
  }

  const candidate = input as Partial<WorkspaceDocument>
  const warnings: string[] = []

  if (!candidate.schemaVersion) {
    warnings.push('Missing schemaVersion; attempting migration as schema v1.')
  }

  if (candidate.schemaVersion && candidate.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      warnings,
      errors: [`Workspace schema v${candidate.schemaVersion} is newer than this app supports.`],
    }
  }

  return {
    document: {
      ...candidate,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      version: typeof candidate.version === 'number' ? candidate.version : 1,
    } as WorkspaceDocument,
    warnings,
    errors: [],
  }
}

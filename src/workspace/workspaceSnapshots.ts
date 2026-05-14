import type { SerializedEditorCommand } from '../editor/editorCommands'
import type { WorkspaceDocument } from './workspaceDocument'

export type WorkspaceSnapshotMetadata = {
  id: string
  timestamp: number
  workspaceVersion: number
  commandDepth: number
  label?: string
  parentSnapshotId?: string
  sourceCommandId?: string
  checksum?: string
}

export type WorkspaceSnapshot = {
  metadata: WorkspaceSnapshotMetadata
  document: WorkspaceDocument
}

export type WorkspaceSnapshotState = {
  snapshots: WorkspaceSnapshot[]
  maxSnapshots: number
}

export type WorkspaceRetentionPolicy = {
  maxCommandCount: number
  maxSnapshotCount: number
  maxTimelineAgeDays: number
  protectedSnapshotIds: string[]
}

export function createWorkspaceSnapshotState(maxSnapshots = 25): WorkspaceSnapshotState {
  return {
    snapshots: [],
    maxSnapshots,
  }
}

export function createWorkspaceSnapshot(
  document: WorkspaceDocument,
  commandDepth: number,
  label?: string,
  lineage?: Pick<WorkspaceSnapshotMetadata, 'parentSnapshotId' | 'sourceCommandId'>,
): WorkspaceSnapshot {
  const clonedDocument = structuredClone(document)
  return {
    metadata: {
      id: `workspace-snapshot:${crypto.randomUUID()}`,
      timestamp: Date.now(),
      workspaceVersion: document.version,
      commandDepth,
      label,
      parentSnapshotId: lineage?.parentSnapshotId,
      sourceCommandId: lineage?.sourceCommandId,
      checksum: createSnapshotChecksum(clonedDocument),
    },
    document: clonedDocument,
  }
}

export function addWorkspaceSnapshot(state: WorkspaceSnapshotState, snapshot: WorkspaceSnapshot): WorkspaceSnapshotState {
  return {
    ...state,
    snapshots: [snapshot, ...state.snapshots].slice(0, state.maxSnapshots),
  }
}

export function restoreWorkspaceSnapshot(snapshot: WorkspaceSnapshot): WorkspaceDocument {
  return structuredClone(snapshot.document)
}

export function shouldCreateCommandSnapshot(commandDepth: number, every = 10) {
  return commandDepth > 0 && commandDepth % every === 0
}

export function createSnapshotFromCommand(command: SerializedEditorCommand, commandDepth: number) {
  return createWorkspaceSnapshot(command.after, commandDepth, command.label, { sourceCommandId: command.id })
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function createSnapshotChecksum(document: WorkspaceDocument) {
  const text = stableStringify(document)
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function verifySnapshotChecksum(snapshot: WorkspaceSnapshot) {
  return !snapshot.metadata.checksum || snapshot.metadata.checksum === createSnapshotChecksum(snapshot.document)
}

export function scoreRestoreCandidate(snapshot: WorkspaceSnapshot, currentVersion: number) {
  const versionDistance = Math.abs(currentVersion - snapshot.metadata.workspaceVersion)
  const checksumBonus = verifySnapshotChecksum(snapshot) ? 10 : -100
  return Math.max(0, 100 - versionDistance * 4 + checksumBonus)
}

export function compareSnapshots(left: WorkspaceSnapshot, right: WorkspaceSnapshot) {
  return {
    leftId: left.metadata.id,
    rightId: right.metadata.id,
    versionDelta: right.metadata.workspaceVersion - left.metadata.workspaceVersion,
    commandDepthDelta: right.metadata.commandDepth - left.metadata.commandDepth,
    sameLineage: right.metadata.parentSnapshotId === left.metadata.id || left.metadata.parentSnapshotId === right.metadata.id,
  }
}

export function pruneWorkspaceSnapshots(
  state: WorkspaceSnapshotState,
  policy: Pick<WorkspaceRetentionPolicy, 'maxSnapshotCount' | 'maxTimelineAgeDays' | 'protectedSnapshotIds'>,
): WorkspaceSnapshotState {
  const minTimestamp = Date.now() - policy.maxTimelineAgeDays * 24 * 60 * 60 * 1000
  const protectedSnapshots = state.snapshots.filter((snapshot) => policy.protectedSnapshotIds.includes(snapshot.metadata.id))
  const retained = state.snapshots
    .filter((snapshot) => snapshot.metadata.timestamp >= minTimestamp || policy.protectedSnapshotIds.includes(snapshot.metadata.id))
    .slice(0, policy.maxSnapshotCount)

  return {
    ...state,
    snapshots: Array.from(new Map([...protectedSnapshots, ...retained].map((snapshot) => [snapshot.metadata.id, snapshot])).values()),
  }
}

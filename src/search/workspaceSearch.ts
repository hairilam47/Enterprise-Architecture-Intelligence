import type { CollaborationSession } from '../collaboration/collaborationSession'
import type { OperationQueueState } from '../collaboration/operationQueue'
import type { DomainRegistryState } from '../domain/domainTypes'
import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import type { WorkspaceCheckpointState } from '../workspace/workspaceCheckpoints'
import type { WorkspaceSnapshotState } from '../workspace/workspaceSnapshots'

export type WorkspaceSearchResult = {
  id: string
  type:
    | 'entity'
    | 'component'
    | 'relationship'
    | 'domain'
    | 'checkpoint'
    | 'snapshot'
    | 'session'
    | 'operation'
  title: string
  subtitle?: string
  keywords: string[]
  onOpen: () => void
}

export type WorkspaceSearchInput = {
  registry: DomainRegistryState
  graph: EnterpriseGraph
  checkpoints: WorkspaceCheckpointState
  snapshots: WorkspaceSnapshotState
  sessions: CollaborationSession[]
  operationQueue: OperationQueueState
  openEntity: (entityId: string) => void
  openGraphNode: (nodeId: string) => void
  openCheckpoint: (checkpointId: string) => void
  openSnapshot: (snapshotId: string) => void
  openCollaboration: () => void
}

function fuzzyIncludes(value: string, query: string) {
  const normalizedValue = value.toLowerCase()
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  let cursor = 0
  for (const character of normalizedQuery) {
    cursor = normalizedValue.indexOf(character, cursor)
    if (cursor === -1) return false
    cursor += 1
  }

  return true
}

export function buildWorkspaceSearchIndex(input: WorkspaceSearchInput): WorkspaceSearchResult[] {
  const entityResults = input.registry.entities.map((entity) => ({
    id: entity.id,
    type: 'entity' as const,
    title: entity.name,
    subtitle: `${entity.kind} · ${entity.ownerTeam} · ${entity.status}`,
    keywords: [entity.kind, entity.ownerTeam, entity.status, ...entity.tags, JSON.stringify(entity.metadata)],
    onOpen: () => input.openEntity(entity.id),
  }))

  const relationshipResults = input.registry.relationships.map((relationship) => ({
    id: relationship.id,
    type: 'relationship' as const,
    title: relationship.relationship,
    subtitle: `${relationship.sourceEntityId} to ${relationship.targetEntityId}`,
    keywords: [relationship.relationship, relationship.description ?? ''],
    onOpen: input.openCollaboration,
  }))

  const graphResults = input.graph.nodes.map((node) => ({
    id: node.id,
    type: 'component' as const,
    title: node.label,
    subtitle: `${node.type} · ${node.layer}`,
    keywords: [node.type, node.layer, JSON.stringify(node.metadata)],
    onOpen: () => input.openGraphNode(node.id),
  }))

  const checkpointResults = input.checkpoints.checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    type: 'checkpoint' as const,
    title: checkpoint.name,
    subtitle: checkpoint.description ?? `Command depth ${checkpoint.commandDepth}`,
    keywords: [checkpoint.snapshotId, checkpoint.createdAt],
    onOpen: () => input.openCheckpoint(checkpoint.id),
  }))

  const snapshotResults = input.snapshots.snapshots.map((snapshot) => ({
    id: snapshot.metadata.id,
    type: 'snapshot' as const,
    title: snapshot.metadata.label ?? 'Workspace snapshot',
    subtitle: `Version ${snapshot.metadata.workspaceVersion} · depth ${snapshot.metadata.commandDepth}`,
    keywords: [snapshot.metadata.id, snapshot.metadata.timestamp],
    onOpen: () => input.openSnapshot(snapshot.metadata.id),
  }))

  const sessionResults = input.sessions.map((session) => ({
    id: session.sessionId,
    type: 'session' as const,
    title: session.authorId,
    subtitle: `${session.operationStream.length} operations · ${session.selection.nodeIds.length} selections`,
    keywords: [session.sessionId, session.authorId],
    onOpen: input.openCollaboration,
  }))

  const operationResults = [...input.operationQueue.pending, ...input.operationQueue.merged].map((operation) => ({
    id: operation.operation.operationId,
    type: 'operation' as const,
    title: operation.type,
    subtitle: `${operation.operation.sessionId} · clock ${operation.operation.logicalClock}`,
    keywords: [operation.operation.operationId, operation.operation.sessionId, operation.operation.authorId ?? '', operation.label],
    onOpen: input.openCollaboration,
  }))

  return [
    ...entityResults,
    ...relationshipResults,
    ...graphResults,
    ...checkpointResults,
    ...snapshotResults,
    ...sessionResults,
    ...operationResults,
  ]
}

export function searchWorkspace(index: WorkspaceSearchResult[], query: string) {
  return index
    .filter((result) =>
      fuzzyIncludes([result.title, result.subtitle, result.type, ...result.keywords].filter(Boolean).join(' '), query),
    )
    .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title))
}

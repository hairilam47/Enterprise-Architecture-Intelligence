import type { WorkspaceDocument } from './workspaceDocument'
import { CURRENT_SCHEMA_VERSION } from './workspaceMigration'

export type WorkspaceDocumentValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function validateWorkspaceDocument(document: unknown): WorkspaceDocumentValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isObject(document)) {
    return { valid: false, errors: ['Workspace document must be a JSON object.'], warnings }
  }

  const doc = document as Partial<WorkspaceDocument>

  if (!doc.schemaVersion) errors.push('schemaVersion is required.')
  if (typeof doc.version !== 'number') errors.push('version is required.')
  if (doc.schemaVersion && doc.schemaVersion > CURRENT_SCHEMA_VERSION) {
    errors.push(`schemaVersion ${doc.schemaVersion} is newer than supported schema ${CURRENT_SCHEMA_VERSION}.`)
  }
  if (!doc.workspaceId || typeof doc.workspaceId !== 'string') errors.push('workspaceId is required.')
  if (!doc.name || typeof doc.name !== 'string') errors.push('name is required.')
  if (!isObject(doc.layeredArchitectureState)) errors.push('layeredArchitectureState is required.')
  if (!isObject(doc.domainRegistryState)) errors.push('domainRegistryState is required.')
  if (!isObject(doc.compositionCanvasState)) errors.push('compositionCanvasState is required.')
  if (!Array.isArray(doc.auditEvents)) errors.push('auditEvents must be an array.')
  if (!Array.isArray(doc.historySnapshots)) errors.push('historySnapshots must be an array.')
  if (doc.commandHistoryState && !isObject(doc.commandHistoryState)) errors.push('commandHistoryState must be an object when present.')
  if (doc.workspaceSnapshots && !Array.isArray(doc.workspaceSnapshots)) errors.push('workspaceSnapshots must be an array when present.')
  if (doc.workspaceCheckpoints && !Array.isArray(doc.workspaceCheckpoints)) errors.push('workspaceCheckpoints must be an array when present.')
  if (doc.editorEvents && !Array.isArray(doc.editorEvents)) errors.push('editorEvents must be an array when present.')
  if (!isObject(doc.traceHighlightState)) errors.push('traceHighlightState is required.')
  if (!isObject(doc.validationState)) warnings.push('validationState is missing or invalid; it can be recalculated after load.')

  const domainRegistry = doc.domainRegistryState
  if (isObject(domainRegistry)) {
    if (!Array.isArray(domainRegistry.entities)) errors.push('domainRegistryState.entities must be an array.')
    if (!Array.isArray(domainRegistry.relationships)) errors.push('domainRegistryState.relationships must be an array.')

    const entityIds = new Set(
      Array.isArray(domainRegistry.entities)
        ? domainRegistry.entities
            .filter((entity): entity is { id: string } => isObject(entity) && typeof entity.id === 'string')
            .map((entity) => entity.id)
        : [],
    )

    if (Array.isArray(domainRegistry.relationships)) {
      domainRegistry.relationships.forEach((relationship, index) => {
        if (!isObject(relationship)) {
          errors.push(`domain relationship ${index} must be an object.`)
          return
        }
        if (typeof relationship.sourceEntityId !== 'string') errors.push(`domain relationship ${index} missing sourceEntityId.`)
        if (typeof relationship.targetEntityId !== 'string') errors.push(`domain relationship ${index} missing targetEntityId.`)
        if (typeof relationship.sourceEntityId === 'string' && !entityIds.has(relationship.sourceEntityId)) {
          warnings.push(`domain relationship ${index} references missing source entity ${relationship.sourceEntityId}.`)
        }
        if (typeof relationship.targetEntityId === 'string' && !entityIds.has(relationship.targetEntityId)) {
          warnings.push(`domain relationship ${index} references missing target entity ${relationship.targetEntityId}.`)
        }
      })
    }
  }

  const composition = doc.compositionCanvasState
  if (isObject(composition)) {
    if (!Array.isArray(composition.nodes)) errors.push('compositionCanvasState.nodes must be an array.')
    if (!Array.isArray(composition.edges)) errors.push('compositionCanvasState.edges must be an array.')
    if (!Array.isArray(composition.groups)) errors.push('compositionCanvasState.groups must be an array.')

    const canvasNodeIds = new Set(
      Array.isArray(composition.nodes)
        ? composition.nodes
            .filter((node): node is { id: string } => isObject(node) && typeof node.id === 'string')
            .map((node) => node.id)
        : [],
    )

    if (Array.isArray(composition.edges)) {
      composition.edges.forEach((edge, index) => {
        if (!isObject(edge)) {
          errors.push(`canvas edge ${index} must be an object.`)
          return
        }
        if (typeof edge.sourceNodeId !== 'string') errors.push(`canvas edge ${index} missing sourceNodeId.`)
        if (typeof edge.targetNodeId !== 'string') errors.push(`canvas edge ${index} missing targetNodeId.`)
        if (typeof edge.sourceNodeId === 'string' && !canvasNodeIds.has(edge.sourceNodeId)) {
          warnings.push(`canvas edge ${index} references missing source node ${edge.sourceNodeId}.`)
        }
        if (typeof edge.targetNodeId === 'string' && !canvasNodeIds.has(edge.targetNodeId)) {
          warnings.push(`canvas edge ${index} references missing target node ${edge.targetNodeId}.`)
        }
      })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

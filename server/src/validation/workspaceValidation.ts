import type { WorkspaceValidationResult } from '../types/workspaceDocument.js'

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function validateWorkspaceDocument(input: unknown): WorkspaceValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isObject(input)) {
    return { valid: false, errors: ['Workspace document must be a JSON object.'], warnings }
  }

  if (typeof input.schemaVersion !== 'number') errors.push('schemaVersion is required.')
  if (typeof input.version !== 'number') errors.push('version is required.')
  if (typeof input.workspaceId !== 'string' || input.workspaceId.length === 0) errors.push('workspaceId is required.')
  if (typeof input.name !== 'string' || input.name.length === 0) errors.push('name is required.')
  if (typeof input.createdAt !== 'string' || input.createdAt.length === 0) errors.push('createdAt is required.')
  if (typeof input.updatedAt !== 'string' || input.updatedAt.length === 0) errors.push('updatedAt is required.')
  if (!isObject(input.layeredArchitectureState)) errors.push('layeredArchitectureState is required.')
  if (!isObject(input.domainRegistryState)) errors.push('domainRegistryState is required.')
  if (!isObject(input.compositionCanvasState)) errors.push('compositionCanvasState is required.')
  if (!Array.isArray(input.auditEvents)) errors.push('auditEvents must be an array.')
  if (!Array.isArray(input.historySnapshots)) warnings.push('historySnapshots should be an array.')
  if (!isObject(input.traceHighlightState)) warnings.push('traceHighlightState should be an object.')
  if (!isObject(input.validationState)) warnings.push('validationState should be an object.')
  if (!isObject(input.visualPreferences)) warnings.push('visualPreferences should be an object.')

  const domainRegistry = input.domainRegistryState
  if (isObject(domainRegistry)) {
    if (!Array.isArray(domainRegistry.entities)) errors.push('domainRegistryState.entities must be an array.')
    if (!Array.isArray(domainRegistry.relationships)) errors.push('domainRegistryState.relationships must be an array.')
  }

  const composition = input.compositionCanvasState
  if (isObject(composition)) {
    if (!Array.isArray(composition.nodes)) errors.push('compositionCanvasState.nodes must be an array.')
    if (!Array.isArray(composition.edges)) errors.push('compositionCanvasState.edges must be an array.')
    if (!Array.isArray(composition.groups)) errors.push('compositionCanvasState.groups must be an array.')
  }

  return { valid: errors.length === 0, errors, warnings }
}

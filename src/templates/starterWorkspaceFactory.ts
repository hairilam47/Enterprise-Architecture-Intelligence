import type { DomainRegistryState } from '../domain/domainTypes'
import { enterpriseTemplates } from './enterpriseTemplates'
import { governanceTemplates } from './governanceTemplates'
import { operationalTemplates } from './operationalTemplates'
import type { WorkspaceTemplate } from './templateTypes'
import { mergeTemplateIntoRegistry } from './workspaceSeedGenerators'

export const workspaceTemplates: WorkspaceTemplate[] = [
  ...enterpriseTemplates,
  ...operationalTemplates,
  ...governanceTemplates,
]

export function getWorkspaceTemplate(templateId: string) {
  return workspaceTemplates.find((template) => template.id === templateId)
}

export function applyWorkspaceTemplate(registry: DomainRegistryState, templateId: string): DomainRegistryState {
  const template = getWorkspaceTemplate(templateId)
  if (!template) return registry
  return mergeTemplateIntoRegistry(registry, template)
}

import type { DomainWorkspaceProps } from './workspaceProps'
import { DomainWorkspace } from './DomainWorkspace'

export function RequirementsWorkspace(props: DomainWorkspaceProps) {
  return <DomainWorkspace {...props} title="Requirements" kind="requirement" />
}

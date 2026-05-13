import { DomainWorkspace } from './DomainWorkspace'
import type { DomainWorkspaceProps } from './workspaceProps'

export function OperationsWorkspace(props: DomainWorkspaceProps) {
  return <DomainWorkspace {...props} title="Operations" kind="incident" />
}

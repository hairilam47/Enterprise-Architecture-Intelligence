import { DomainWorkspace } from './DomainWorkspace'
import type { DomainWorkspaceProps } from './workspaceProps'

export function DataWorkspace(props: DomainWorkspaceProps) {
  return <DomainWorkspace {...props} title="Data" kind="databaseTable" />
}

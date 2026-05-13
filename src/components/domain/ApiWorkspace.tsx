import { DomainWorkspace } from './DomainWorkspace'
import type { DomainWorkspaceProps } from './workspaceProps'

export function ApiWorkspace(props: DomainWorkspaceProps) {
  return <DomainWorkspace {...props} title="APIs" kind="api" />
}

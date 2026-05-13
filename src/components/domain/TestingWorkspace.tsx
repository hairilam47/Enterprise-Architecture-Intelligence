import { DomainWorkspace } from './DomainWorkspace'
import type { DomainWorkspaceProps } from './workspaceProps'

export function TestingWorkspace(props: DomainWorkspaceProps) {
  return <DomainWorkspace {...props} title="Testing" kind="testCase" />
}

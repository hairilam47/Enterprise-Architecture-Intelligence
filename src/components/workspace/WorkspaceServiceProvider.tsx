import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { createApiWorkspaceRepository } from '../../services/apiWorkspaceRepository'
import { createLocalWorkspaceRepository } from '../../services/localWorkspaceRepository'
import { createMockApiWorkspaceRepository } from '../../services/mockApiWorkspaceRepository'
import { createWorkspaceService, type WorkspaceService } from '../../services/workspaceService'

export type WorkspaceRepositoryMode = 'local' | 'mockApi' | 'api'

type WorkspaceServiceContextValue = {
  repositoryMode: WorkspaceRepositoryMode
  setRepositoryMode: (mode: WorkspaceRepositoryMode) => void
  workspaceService: WorkspaceService
}

const WorkspaceServiceContext = createContext<WorkspaceServiceContextValue | undefined>(undefined)

export function WorkspaceServiceProvider({ children }: { children: ReactNode }) {
  const [repositoryMode, setRepositoryMode] = useState<WorkspaceRepositoryMode>('local')

  const repository = useMemo(
    () => {
      if (repositoryMode === 'api') return createApiWorkspaceRepository()
      if (repositoryMode === 'mockApi') return createMockApiWorkspaceRepository()
      return createLocalWorkspaceRepository()
    },
    [repositoryMode],
  )
  const workspaceService = useMemo(() => createWorkspaceService(repository), [repository])

  return (
    <WorkspaceServiceContext.Provider value={{ repositoryMode, setRepositoryMode, workspaceService }}>
      {children}
    </WorkspaceServiceContext.Provider>
  )
}

export function useWorkspaceService() {
  const context = useContext(WorkspaceServiceContext)
  if (!context) {
    throw new Error('useWorkspaceService must be used inside WorkspaceServiceProvider.')
  }
  return context
}

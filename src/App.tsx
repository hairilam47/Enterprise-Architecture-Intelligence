import { useEffect } from 'react'
import './App.css'
import './theme/theme.css'
import { EAWorkspace } from './components/canvas/EAWorkspace'
import { useEAStore } from './store/eaStore'
import { seedProject } from './store/eaSeedData'

function EAStoreInit() {
  const loadProject = useEAStore((s) => s.loadProject)
  useEffect(() => {
    loadProject(seedProject)
  }, [loadProject])
  return null
}

function App() {
  return (
    <>
      <EAStoreInit />
      <EAWorkspace />
    </>
  )
}

export default App

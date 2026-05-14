import './App.css'
import './theme/theme.css'
import { LayeredWorkspace } from './components/LayeredWorkspace'
import { WorkspaceServiceProvider } from './components/workspace/WorkspaceServiceProvider'

function App() {
  return (
    <WorkspaceServiceProvider>
      <LayeredWorkspace />
    </WorkspaceServiceProvider>
  )
}

export default App

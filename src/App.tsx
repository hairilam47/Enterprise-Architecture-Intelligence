import './App.css'
import './theme/theme.css'
import { useEffect, useState } from 'react'
import { LayeredWorkspace } from './components/LayeredWorkspace'
import { WorkspaceServiceProvider } from './components/workspace/WorkspaceServiceProvider'
import { ToastContainer } from './components/Toast'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ea-theme')
    if (saved !== null) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('ea-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <WorkspaceServiceProvider>
      <button
        type="button"
        className="theme-toggle"
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Light mode' : 'Dark mode'}
        onClick={() => setDarkMode((d) => !d)}
      >
        {darkMode ? '☀' : '☾'}
      </button>
      <LayeredWorkspace />
      <ToastContainer />
    </WorkspaceServiceProvider>
  )
}

export default App

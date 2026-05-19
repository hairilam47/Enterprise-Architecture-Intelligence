/**
 * EAWorkspace — the unified, store-driven EA application shell.
 *
 * Layout:
 *   TopBar (ViewSwitcher + toolbar actions)
 *   └── HorizontalSplit
 *       ├── ShapePalette (left, 200px)
 *       ├── Main canvas area (flex 1)
 *       │   ├── EACanvas  (2D)
 *       │   ├── D3 graph  (existing component, wired to store)
 *       │   └── 3D scene  (existing LazyThreeArchitectureView, wired to store)
 *       ├── PropertiesPanel (right, 240px)
 *       └── ImpactAnalysisPanel (right, 240px — togglable)
 */

import { useState } from 'react'
import { useEAStore } from '../../store/eaStore'
import { ShapePalette } from './ShapePalette'
import { EACanvas } from './EACanvas'
import { ViewSwitcher } from './ViewSwitcher'
import { PropertiesPanel } from './PropertiesPanel'
import { ImpactAnalysisPanel } from './ImpactAnalysisPanel'
import { StoreGraphView } from './StoreGraphView'
import { StoreThreeView } from './StoreThreeView'
import { downloadJSON, downloadArchiMateXML } from '../../io/exportProject'

type ViewTab = 'canvas' | 'graph' | '3d'

type ToolbarAction = {
  key: string
  label: string
  icon: string
  action: () => void
  active?: boolean
}

export function EAWorkspace() {
  const [activeViewTab, setActiveViewTab] = useState<ViewTab>('canvas')
  const [showImpact, setShowImpact] = useState(false)
  const [showPalette, setShowPalette] = useState(true)

  const undo = useEAStore((s) => s.undo)
  const redo = useEAStore((s) => s.redo)
  const undoStack = useEAStore((s) => s.undoStack)
  const redoStack = useEAStore((s) => s.redoStack)
  const selectedIds = useEAStore((s) => s.project.selectedElementIds)
  const removeElement = useEAStore((s) => s.removeElement)
  const clearSelection = useEAStore((s) => s.clearSelection)

  // Keyboard handler (attached at workspace level)
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      redo()
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedIds.length > 0) {
        selectedIds.forEach((id) => removeElement(id))
        clearSelection()
      }
    } else if (e.key === 'Escape') {
      clearSelection()
    }
  }

  const project = useEAStore((s) => s.project)

  const toolbarActions: ToolbarAction[] = [
    { key: 'palette', label: 'Palette',   icon: '◫', action: () => setShowPalette((v) => !v), active: showPalette },
    { key: 'undo',    label: 'Undo',      icon: '↩', action: undo,   active: undoStack.length > 0 },
    { key: 'redo',    label: 'Redo',      icon: '↪', action: redo,   active: redoStack.length > 0 },
    { key: 'impact',  label: 'Impact',    icon: '⚡', action: () => setShowImpact((v) => !v), active: showImpact },
    { key: 'json',    label: 'Export JSON',  icon: '↓J', action: () => downloadJSON(project) },
    { key: 'xml',     label: 'Export XML',   icon: '↓X', action: () => downloadArchiMateXML(project) },
  ]

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: workspace host
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface, #1a1a2e)', borderBottom: '1px solid #2a2a4a', flexShrink: 0, zIndex: 10 }}>
        <ViewSwitcher activeView={activeViewTab} onChange={setActiveViewTab} />

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 2, padding: '0 8px', marginLeft: 'auto' }}>
          {toolbarActions.map((t) => (
            <button
              key={t.key}
              onClick={t.action}
              title={t.label}
              style={{
                width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                background: t.active ? 'rgba(96,165,250,0.15)' : 'transparent',
                color: t.active ? '#60A5FA' : '#888',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Shape palette (left) */}
        {showPalette && <ShapePalette />}

        {/* Canvas area */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeViewTab === 'canvas' && <EACanvas />}
          {activeViewTab === 'graph' && <StoreGraphView />}
          {activeViewTab === '3d' && <StoreThreeView />}
        </div>

        {/* Right panels */}
        <PropertiesPanel />
        {showImpact && <ImpactAnalysisPanel onClose={() => setShowImpact(false)} />}
      </div>
    </div>
  )
}


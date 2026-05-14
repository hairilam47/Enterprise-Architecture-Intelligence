import type { EditorState } from '../../editor/editorStore'
import { selectLastCommand } from '../../editor/editorSelectors'
import { CommandInspector } from './CommandInspector'

type CommandHistoryPanelProps = {
  editorState: EditorState
}

export function CommandHistoryPanel({ editorState }: CommandHistoryPanelProps) {
  if (!import.meta.env.DEV) return null

  const lastCommand = selectLastCommand(editorState)

  return (
    <section className="command-debug-grid" aria-label="Command history debug panel">
      <div className="panel command-history-panel">
        <p className="eyebrow">Editor Runtime Debug</p>
        <h2>Command history</h2>
        <div className="workspace-status-grid">
          <span>{editorState.commandHistory.undoStack.length} undo</span>
          <span>{editorState.commandHistory.redoStack.length} redo</span>
          <span>{editorState.transactions.stack.length} transactions</span>
          <span>{editorState.snapshots.snapshots.length} snapshots</span>
          <span>{editorState.events.length} events</span>
        </div>
        <div className="command-stack-grid">
          <section>
            <h3>Undo Stack</h3>
            <ol>
              {editorState.commandHistory.undoStack.slice(0, 8).map((command) => (
                <li key={command.id}>
                  <strong>{command.label}</strong>
                  <span>{command.type}</span>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h3>Redo Stack</h3>
            <ol>
              {editorState.commandHistory.redoStack.slice(0, 8).map((command) => (
                <li key={command.id}>
                  <strong>{command.label}</strong>
                  <span>{command.type}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      <CommandInspector command={lastCommand} />
    </section>
  )
}

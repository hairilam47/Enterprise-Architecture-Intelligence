import { useRef, useState } from 'react'
import { deserializeWorkspace } from '../../workspace/workspaceSerializer'
import type { WorkspaceDocument } from '../../workspace/workspaceDocument'
import { useWorkspaceService } from './WorkspaceServiceProvider'

type ExportImportPanelProps = {
  document: WorkspaceDocument
  onImportWorkspace: (document: WorkspaceDocument) => void
}

export function ExportImportPanel({ document, onImportWorkspace }: ExportImportPanelProps) {
  const { workspaceService } = useWorkspaceService()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [messages, setMessages] = useState<{ errors: string[]; warnings: string[] }>({ errors: [], warnings: [] })

  function exportWorkspace() {
    const result = workspaceService.exportWorkspaceDocument(document)
    if (!result.ok || !result.data) {
      setMessages({ errors: result.error?.details?.length ? result.error.details : [result.error?.message ?? 'Export failed.'], warnings: result.warnings })
      return
    }

    const blob = new Blob([result.data.json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${document.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'workspace'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importWorkspace(file?: File) {
    if (!file) return
    const result = deserializeWorkspace(await file.text())
    setMessages({ errors: result.errors, warnings: result.warnings })
    if (result.document) {
      const serviceResult = await workspaceService.importWorkspace(result.document)
      setMessages({
        errors: serviceResult.ok ? [] : serviceResult.error?.details?.length ? serviceResult.error.details : [serviceResult.error?.message ?? 'Import failed.'],
        warnings: [...result.warnings, ...serviceResult.warnings],
      })
      if (serviceResult.ok && serviceResult.data) {
        onImportWorkspace(serviceResult.data.document)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="panel export-import-panel">
      <div className="panel__header">
        <p className="eyebrow">Export / Import</p>
        <h2>Portable workspace JSON</h2>
      </div>
      <div className="overlay-actions">
        <button type="button" onClick={exportWorkspace}>Export JSON</button>
        <button type="button" onClick={() => inputRef.current?.click()}>Import JSON</button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => importWorkspace(event.target.files?.[0])}
      />

      {messages.errors.length > 0 || messages.warnings.length > 0 ? (
        <section>
          <h3>Import Validation</h3>
          <ul className="issue-list compact-issues">
            {messages.errors.map((message) => (
              <li key={message} data-severity="critical"><span>Error</span><strong>{message}</strong></li>
            ))}
            {messages.warnings.map((message) => (
              <li key={message} data-severity="warning"><span>Warning</span><strong>{message}</strong></li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="empty-state">Imports are validated before they replace the current workspace.</p>
      )}
    </section>
  )
}

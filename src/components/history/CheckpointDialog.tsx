import { useState } from 'react'

type CheckpointDialogProps = {
  open: boolean
  onCreate: (name: string, description: string) => void
  onCancel: () => void
}

export function CheckpointDialog({ open, onCreate, onCancel }: CheckpointDialogProps) {
  const [name, setName] = useState('Architecture checkpoint')
  const [description, setDescription] = useState('')

  if (!open) return null

  return (
    <div className="history-dialog" role="dialog" aria-modal="true" aria-label="Create checkpoint">
      <div className="panel">
        <p className="eyebrow">Named Checkpoint</p>
        <h2>Create restore point</h2>
        <label>
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>Description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <div className="overlay-actions">
          <button type="button" onClick={() => onCreate(name.trim() || 'Architecture checkpoint', description.trim())}>Create</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

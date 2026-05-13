import { useState } from 'react'
import type { DomainEntityDraft, DomainEntityKind } from '../../domain/domainTypes'

type EntityFormProps = {
  kind: DomainEntityKind
  onSubmit: (draft: DomainEntityDraft) => void
}

function parseMetadata(value: string): Record<string, string> {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((metadata, line) => {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) metadata[key.trim()] = rest.join('=').trim()
      return metadata
    }, {})
}

export function EntityForm({ kind, onSubmit }: EntityFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerTeam, setOwnerTeam] = useState('')
  const [status, setStatus] = useState<DomainEntityDraft['status']>('active')
  const [tags, setTags] = useState('')
  const [metadata, setMetadata] = useState('')
  const isValid = name.trim().length > 1 && ownerTeam.trim().length > 1

  return (
    <form
      className="entity-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValid) return
        onSubmit({
          kind,
          name,
          description,
          ownerTeam,
          status,
          tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          metadata: parseMetadata(metadata),
        })
        setName('')
        setDescription('')
        setTags('')
        setMetadata('')
      }}
    >
      <input value={name} placeholder="Entity name" onChange={(event) => setName(event.target.value)} />
      <input value={ownerTeam} placeholder="Owner team" onChange={(event) => setOwnerTeam(event.target.value)} />
      <select value={status} onChange={(event) => setStatus(event.target.value as DomainEntityDraft['status'])}>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="at_risk">At risk</option>
        <option value="deprecated">Deprecated</option>
        <option value="resolved">Resolved</option>
      </select>
      <textarea value={description} placeholder="Description" onChange={(event) => setDescription(event.target.value)} />
      <input value={tags} placeholder="Tags, comma separated" onChange={(event) => setTags(event.target.value)} />
      <textarea value={metadata} placeholder="Metadata, one key=value per line" onChange={(event) => setMetadata(event.target.value)} />
      <button type="submit" disabled={!isValid}>Create {kind}</button>
    </form>
  )
}

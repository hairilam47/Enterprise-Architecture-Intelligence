import { useEffect, useMemo, useState } from 'react'
import type { CommandAction, CommandPaletteItem } from './commandTypes'
import { sortCommands } from './commandRegistry'
import { searchWorkspace, type WorkspaceSearchResult } from '../search/workspaceSearch'

type CommandPaletteProps = {
  open: boolean
  commands: CommandAction[]
  searchIndex: WorkspaceSearchResult[]
  recentQueries: string[]
  onClose: () => void
  onQueryCommit: (query: string) => void
}

export function CommandPalette({
  open,
  commands,
  searchIndex,
  recentQueries,
  onClose,
  onQueryCommit,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  const items = useMemo<CommandPaletteItem[]>(() => {
    const commandItems = sortCommands(commands, query).slice(0, 8).map((command) => ({
      kind: 'command' as const,
      id: command.id,
      title: command.title,
      subtitle: command.description,
      scope: command.scope,
      shortcut: command.shortcut,
      perform: command.perform,
    }))

    const resultItems = searchWorkspace(searchIndex, query).slice(0, 10).map((result) => ({
      kind: 'search-result' as const,
      id: result.id,
      title: result.title,
      subtitle: result.subtitle,
      resultType: result.type,
      perform: result.onOpen,
    }))

    return [...commandItems, ...resultItems]
  }, [commands, query, searchIndex])

  if (!open) return null

  const activeItem = items[activeIndex]

  function runItem(item?: CommandPaletteItem) {
    if (!item) return
    onQueryCommit(query)
    item.perform()
    onClose()
  }

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-palette__input">
          <span aria-hidden="true">K</span>
          <input
            autoFocus
            value={query}
            placeholder="Search commands, entities, checkpoints, sessions..."
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActiveIndex((current) => Math.min(items.length - 1, current + 1))
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActiveIndex((current) => Math.max(0, current - 1))
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                runItem(activeItem)
              }
            }}
          />
        </div>

        {!query && recentQueries.length > 0 ? (
          <div className="command-palette__recents" aria-label="Recent searches">
            {recentQueries.slice(0, 5).map((recentQuery) => (
              <button key={recentQuery} type="button" onClick={() => setQuery(recentQuery)}>
                {recentQuery}
              </button>
            ))}
          </div>
        ) : null}

        <div className="command-palette__list">
          {items.map((item, index) => (
            <button
              key={`${item.kind}:${item.id}`}
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runItem(item)}
            >
              <span>{item.kind === 'command' ? item.scope : item.resultType}</span>
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
              {item.kind === 'command' && item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
            </button>
          ))}
          {items.length === 0 ? <p className="command-palette__empty">No commands or workspace results found.</p> : null}
        </div>
      </section>
    </div>
  )
}

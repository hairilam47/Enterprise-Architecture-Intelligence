import type { CommandAction } from './commandTypes'

export function normalizeCommandText(value: string) {
  return value.trim().toLowerCase()
}

export function commandMatchesQuery(command: CommandAction, query: string) {
  const normalizedQuery = normalizeCommandText(query)
  if (!normalizedQuery) return true

  const haystack = normalizeCommandText(
    [
      command.title,
      command.description,
      command.scope,
      command.shortcut,
      ...(command.keywords ?? []),
    ]
      .filter(Boolean)
      .join(' '),
  )

  let cursor = 0
  for (const character of normalizedQuery) {
    cursor = haystack.indexOf(character, cursor)
    if (cursor === -1) return false
    cursor += 1
  }

  return true
}

export function sortCommands(commands: CommandAction[], query: string) {
  const normalizedQuery = normalizeCommandText(query)
  return [...commands]
    .filter((command) => commandMatchesQuery(command, normalizedQuery))
    .sort((a, b) => {
      const aTitle = normalizeCommandText(a.title)
      const bTitle = normalizeCommandText(b.title)
      const aStarts = normalizedQuery && aTitle.startsWith(normalizedQuery) ? -1 : 0
      const bStarts = normalizedQuery && bTitle.startsWith(normalizedQuery) ? -1 : 0
      return aStarts - bStarts || a.scope.localeCompare(b.scope) || a.title.localeCompare(b.title)
    })
}

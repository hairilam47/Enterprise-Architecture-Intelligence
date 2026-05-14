export type CommandScope = 'workspace' | 'navigation' | 'replay' | 'productivity' | 'mode' | 'developer'

export type CommandAction = {
  id: string
  title: string
  description?: string
  scope: CommandScope
  keywords?: string[]
  shortcut?: string
  perform: () => void
}

export type CommandPaletteItem =
  | {
      kind: 'command'
      id: string
      title: string
      subtitle?: string
      scope: CommandScope
      shortcut?: string
      perform: () => void
    }
  | {
      kind: 'search-result'
      id: string
      title: string
      subtitle?: string
      resultType: string
      perform: () => void
    }

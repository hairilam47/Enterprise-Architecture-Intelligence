import { hydrateWorkspaceCommand, type EditorCommand, type EditorCommandType, type SerializedEditorCommand } from './editorCommands'

export type CommandFactory = (command: SerializedEditorCommand) => EditorCommand

export type CommandRegistry = {
  register: (type: EditorCommandType, factory: CommandFactory) => void
  hydrate: (command: SerializedEditorCommand) => EditorCommand
  supportedTypes: () => EditorCommandType[]
}

export function createCommandRegistry(): CommandRegistry {
  const factories = new Map<EditorCommandType, CommandFactory>()

  return {
    register(type, factory) {
      factories.set(type, factory)
    },

    hydrate(command) {
      return factories.get(command.type)?.(command) ?? hydrateWorkspaceCommand(command)
    },

    supportedTypes() {
      return [...factories.keys()]
    },
  }
}

export const commandRegistry = createCommandRegistry()

commandRegistry.register('workspace.rename', hydrateWorkspaceCommand)
commandRegistry.register('workspace.reset', hydrateWorkspaceCommand)
commandRegistry.register('workspace.import', hydrateWorkspaceCommand)
commandRegistry.register('workspace.restore', hydrateWorkspaceCommand)
commandRegistry.register('layer.plugin.swap', hydrateWorkspaceCommand)
commandRegistry.register('domain.entity.create', hydrateWorkspaceCommand)
commandRegistry.register('domain.entity.delete', hydrateWorkspaceCommand)
commandRegistry.register('domain.relationship.create', hydrateWorkspaceCommand)
commandRegistry.register('composition.state.replace', hydrateWorkspaceCommand)
commandRegistry.register('composition.node.create', hydrateWorkspaceCommand)
commandRegistry.register('composition.node.delete', hydrateWorkspaceCommand)
commandRegistry.register('composition.node.move', hydrateWorkspaceCommand)
commandRegistry.register('composition.node.resize', hydrateWorkspaceCommand)
commandRegistry.register('composition.node.rename', hydrateWorkspaceCommand)
commandRegistry.register('composition.edge.connect', hydrateWorkspaceCommand)
commandRegistry.register('composition.edge.remove', hydrateWorkspaceCommand)
commandRegistry.register('composition.metadata.update', hydrateWorkspaceCommand)
commandRegistry.register('viewport.change', hydrateWorkspaceCommand)
commandRegistry.register('selection.change', hydrateWorkspaceCommand)
commandRegistry.register('transaction.batch', hydrateWorkspaceCommand)

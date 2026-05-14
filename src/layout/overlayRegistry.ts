import type { LayoutOverlayDefinition, LayoutOverlayId, LayoutState } from './layoutTypes'

type OverlayRegistryOptions = {
  commandPaletteOpen: boolean
  starterWizardOpen: boolean
  launcherOpen: boolean
  shortcutOverlayOpen: boolean
  contextMenuOpen: boolean
  checkpointDialogOpen: boolean
  recoveryImportOpen: boolean
  guidanceVisible: boolean
}

function overlay(
  id: LayoutOverlayId,
  options: Omit<LayoutOverlayDefinition, 'id'>,
): LayoutOverlayDefinition {
  return { id, ...options }
}

export function createOverlayRegistry(
  _layoutState: LayoutState,
  options: OverlayRegistryOptions,
): LayoutOverlayDefinition[] {
  return [
    overlay('remote-cursors', {
      group: 'collaboration',
      zone: 'stage',
      label: 'Remote cursors',
      active: true,
      zLayer: 'utility',
    }),
    overlay('guidance', {
      group: 'guidance',
      zone: 'stage',
      label: 'Workspace guidance',
      active: options.guidanceVisible,
      zLayer: 'utility',
    }),
    overlay('health', {
      group: 'guidance',
      zone: 'right-panel',
      label: 'Architecture health',
      active: false,
      zLayer: 'utility',
    }),
    overlay('recommendations', {
      group: 'guidance',
      zone: 'stage',
      label: 'Recommendations',
      active: false,
      zLayer: 'utility',
    }),
    overlay('zoom-controls', {
      group: 'utility',
      zone: 'stage',
      label: 'Zoom controls',
      active: true,
      zLayer: 'utility',
    }),
    overlay('minimap', {
      group: 'utility',
      zone: 'stage',
      label: 'Minimap',
      active: false,
      zLayer: 'utility',
    }),
    overlay('context-menu', {
      group: 'contextual',
      zone: 'floating',
      label: 'Context menu',
      active: options.contextMenuOpen,
      zLayer: 'overlay',
    }),
    overlay('command-palette', {
      group: 'modal',
      zone: 'floating',
      label: 'Command palette',
      active: options.commandPaletteOpen,
      zLayer: 'modal',
    }),
    overlay('starter-wizard', {
      group: 'modal',
      zone: 'floating',
      label: 'Starter wizard',
      active: options.starterWizardOpen,
      zLayer: 'modal',
    }),
    overlay('workspace-launcher', {
      group: 'modal',
      zone: 'floating',
      label: 'Workspace launcher',
      active: options.launcherOpen,
      zLayer: 'modal',
    }),
    overlay('shortcut-overlay', {
      group: 'modal',
      zone: 'floating',
      label: 'Shortcut overlay',
      active: options.shortcutOverlayOpen,
      zLayer: 'modal',
    }),
    overlay('checkpoint-dialog', {
      group: 'modal',
      zone: 'floating',
      label: 'Checkpoint dialog',
      active: options.checkpointDialogOpen,
      zLayer: 'modal',
    }),
    overlay('recovery-import', {
      group: 'modal',
      zone: 'floating',
      label: 'Recovery import',
      active: options.recoveryImportOpen,
      zLayer: 'modal',
    }),
  ]
}

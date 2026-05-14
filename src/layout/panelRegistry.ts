import type { LayoutPanelDefinition, LayoutState } from './layoutTypes'
import { viewportConstraints } from './viewportConstraints'

export function createPanelRegistry(layoutState: LayoutState): LayoutPanelDefinition[] {
  return [
    {
      id: 'left-navigation',
      zone: 'left-panel',
      label: 'Workspace navigation',
      collapsible: true,
      collapsed: layoutState.leftCollapsed,
      minWidth: viewportConstraints.leftPanel.min,
      maxWidth: viewportConstraints.leftPanel.max,
      zLayer: 'panel',
    },
    {
      id: 'palette-tools',
      zone: 'left-panel',
      label: 'Workspace tools',
      collapsible: true,
      collapsed: layoutState.leftCollapsed,
      minWidth: viewportConstraints.leftPanel.min,
      maxWidth: viewportConstraints.leftPanel.max,
      zLayer: 'panel',
    },
    {
      id: 'right-inspector',
      zone: 'right-panel',
      label: 'Inspector',
      collapsible: true,
      collapsed: layoutState.rightCollapsed,
      minWidth: viewportConstraints.rightInspector.min,
      maxWidth: viewportConstraints.rightInspector.max,
      zLayer: 'panel',
    },
    {
      id: 'bottom-timeline',
      zone: 'bottom-panel',
      label: 'Timeline and recovery',
      collapsible: true,
      collapsed: layoutState.bottomCollapsed,
      zLayer: 'panel',
    },
    {
      id: 'developer-systems',
      zone: 'bottom-panel',
      label: 'Developer systems',
      collapsible: true,
      collapsed: !layoutState.developerMode,
      zLayer: 'panel',
    },
  ]
}

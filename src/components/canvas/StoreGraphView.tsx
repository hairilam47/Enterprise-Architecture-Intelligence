/**
 * StoreGraphView — reads from eaStore and feeds the existing D3EnterpriseGraph.
 * Drop-in replacement for the placeholder in EAWorkspace.
 */
import { useMemo } from 'react'
import { useEAStore } from '../../store/eaStore'
import { projectToVisualGraph } from '../../three/storeToScene'
import { D3EnterpriseGraph } from '../D3EnterpriseGraph'

export function StoreGraphView() {
  const project = useEAStore((s) => s.project)
  const selectedIds = useEAStore((s) => s.project.selectedElementIds)
  const highlightedIds = useEAStore((s) => s.project.highlightedElementIds)

  const visualGraph = useMemo(
    () => projectToVisualGraph(project, project.activeViewId ?? undefined, selectedIds, highlightedIds),
    [project, selectedIds, highlightedIds],
  )

  return (
    <div style={{ flex: 1, overflow: 'hidden', width: '100%', height: '100%' }}>
      <D3EnterpriseGraph visualGraph={visualGraph} />
    </div>
  )
}

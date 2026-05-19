/**
 * StoreThreeView — reads from eaStore and feeds the existing LazyThreeArchitectureView.
 * Handles two-way selection sync: clicking a 3D node sets eaStore.selectedElementIds.
 */
import { useMemo, useEffect } from 'react'
import { useEAStore } from '../../store/eaStore'
import { projectToVisualGraph } from '../../three/storeToScene'
import { LazyThreeArchitectureView } from '../LazyThreeArchitectureView'

export function StoreThreeView() {
  const project = useEAStore((s) => s.project)
  const selectedIds = useEAStore((s) => s.project.selectedElementIds)
  const highlightedIds = useEAStore((s) => s.project.highlightedElementIds)
  const setSelection = useEAStore((s) => s.setSelection)

  const visualGraph = useMemo(
    () => projectToVisualGraph(project, project.activeViewId ?? undefined, selectedIds, highlightedIds),
    [project, selectedIds, highlightedIds],
  )

  // Subscribe to selection changes from the 3D scene via a custom event
  // ThreeArchitectureView fires 'ea:nodeSelected' with detail.nodeId when a mesh is clicked
  useEffect(() => {
    function handleNodeSelected(e: Event) {
      const { nodeId } = (e as CustomEvent).detail ?? {}
      if (nodeId) setSelection([nodeId])
    }
    window.addEventListener('ea:nodeSelected', handleNodeSelected)
    return () => window.removeEventListener('ea:nodeSelected', handleNodeSelected)
  }, [setSelection])

  return (
    <div style={{ flex: 1, width: '100%', height: '100%' }}>
      <LazyThreeArchitectureView visualGraph={visualGraph} />
    </div>
  )
}

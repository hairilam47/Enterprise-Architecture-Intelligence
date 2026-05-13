import { lazy, Suspense } from 'react'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import type { VisualGraph } from '../visualization/visualGraph'

const ThreeArchitectureView = lazy(() =>
  import('./ThreeArchitectureView').then((module) => ({ default: module.ThreeArchitectureView })),
)

type LazyThreeArchitectureViewProps = {
  visualGraph: VisualGraph
  traceHighlight?: TraceHighlightState
}

export function LazyThreeArchitectureView({ visualGraph, traceHighlight }: LazyThreeArchitectureViewProps) {
  return (
    <Suspense fallback={<div className="panel three-loading">Loading spatial architecture view...</div>}>
      <ThreeArchitectureView visualGraph={visualGraph} traceHighlight={traceHighlight} />
    </Suspense>
  )
}

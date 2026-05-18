import type { GraphFocusMode } from '../visualization/graphFocus'
import type { GraphPerformanceSummary } from '../visualization/graphPerformance'

type ZoomTransform = { x: number; y: number; k: number }

type GraphMiniMapProps = {
  totalNodeCount: number
  visibleNodeCount: number
  edgeCount: number
  focusMode: GraphFocusMode
  activeFilters: string[]
  performance: GraphPerformanceSummary
  graphWidth?: number
  graphHeight?: number
  zoomTransform?: ZoomTransform
  onPanTo?: (graphX: number, graphY: number) => void
}

const MINI_W = 240
const MINI_H = 80

export function GraphMiniMap({
  totalNodeCount,
  visibleNodeCount,
  edgeCount,
  focusMode,
  activeFilters,
  performance,
  graphWidth = 900,
  graphHeight = 520,
  zoomTransform,
  onPanTo,
}: GraphMiniMapProps) {
  const scaleX = MINI_W / graphWidth
  const scaleY = MINI_H / graphHeight

  function handleClick(event: React.MouseEvent<SVGSVGElement>) {
    if (!onPanTo) return
    const rect = event.currentTarget.getBoundingClientRect()
    const mx = event.clientX - rect.left
    const my = event.clientY - rect.top
    const graphX = mx / scaleX
    const graphY = my / scaleY
    onPanTo(graphX, graphY)
  }

  // Compute the viewport indicator rect in minimap coordinates
  let vpRect: { x: number; y: number; w: number; h: number } | undefined
  if (zoomTransform) {
    const { x, y, k } = zoomTransform
    const vpLeft = -x / k
    const vpTop = -y / k
    const vpW = graphWidth / k
    const vpH = graphHeight / k
    vpRect = {
      x: vpLeft * scaleX,
      y: vpTop * scaleY,
      w: vpW * scaleX,
      h: vpH * scaleY,
    }
  }

  return (
    <aside className="graph-minimap panel" aria-label="Graph minimap">
      <div className="panel__header">
        <p className="eyebrow">Mini Map</p>
        <h2>Current graph scope</h2>
      </div>

      <dl className="summary-grid minimap-grid">
        <div>
          <dt>Total nodes</dt>
          <dd>{totalNodeCount}</dd>
        </div>
        <div>
          <dt>Visible</dt>
          <dd>{visibleNodeCount}</dd>
        </div>
        <div>
          <dt>Edges</dt>
          <dd>{edgeCount}</dd>
        </div>
      </dl>

      <svg
        className="minimap-nav"
        width={MINI_W}
        height={MINI_H}
        viewBox={`0 0 ${MINI_W} ${MINI_H}`}
        style={{ display: 'block', cursor: onPanTo ? 'crosshair' : 'default', marginBottom: 8 }}
        onClick={handleClick}
        aria-label="Click to pan graph"
      >
        <rect x={0} y={0} width={MINI_W} height={MINI_H} rx={4} fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth={1} />
        {/* Visible proportion bar */}
        <rect
          x={1}
          y={MINI_H - 10}
          width={Math.max(6, (visibleNodeCount / Math.max(totalNodeCount, 1)) * (MINI_W - 2))}
          height={8}
          rx={2}
          fill="#2563eb"
          opacity={0.35}
        />
        {/* Viewport indicator */}
        {vpRect && (
          <rect
            x={Math.max(0, vpRect.x)}
            y={Math.max(0, vpRect.y)}
            width={Math.min(MINI_W, vpRect.w)}
            height={Math.min(MINI_H, vpRect.h)}
            rx={2}
            fill="rgba(37,99,235,0.08)"
            stroke="#2563eb"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}
      </svg>

      <p className="comparison-summary">Focus: {focusMode.replaceAll('_', ' ')}</p>
      <p className="comparison-summary">Density: {performance.density.toFixed(3)}</p>
      {performance.warning ? <div className="layer-warning">{performance.warning}</div> : null}

      <div className="active-filter-list">
        {activeFilters.length ? activeFilters.map((filter) => <span key={filter}>{filter}</span>) : <span>No filters</span>}
      </div>
    </aside>
  )
}

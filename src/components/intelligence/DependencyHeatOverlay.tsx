import type { DependencyHeatPoint } from '../../intelligence/intelligenceTypes'

type DependencyHeatOverlayProps = {
  heatPoints: DependencyHeatPoint[]
}

export function DependencyHeatOverlay({ heatPoints }: DependencyHeatOverlayProps) {
  const visible = heatPoints.filter((point) => point.severity !== 'info').slice(0, 5)
  if (!visible.length) return null

  return (
    <aside className="dependency-heat-overlay" aria-label="Dependency heat overlay">
      <p className="eyebrow">Dependency heat</p>
      {visible.map((point) => (
        <div key={point.entityId}>
          <span className={`heat-dot is-${point.severity}`} />
          <strong>{point.label}</strong>
          <small>{point.centrality} flows</small>
        </div>
      ))}
    </aside>
  )
}

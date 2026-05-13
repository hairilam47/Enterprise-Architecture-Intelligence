import type { TraceabilityMatrix as TraceabilityMatrixModel } from '../../traceability/traceabilityTypes'

type TraceabilityMatrixProps = {
  matrix: TraceabilityMatrixModel
}

export function TraceabilityMatrix({ matrix }: TraceabilityMatrixProps) {
  return (
    <section className="panel trace-panel" aria-label="Traceability matrix">
      <div className="panel__header"><p className="eyebrow">Traceability Matrix</p><h2>Domain coverage</h2></div>
      <div className="trace-matrix">
        <span />
        {matrix.domains.map((domain) => <strong key={domain}>{domain}</strong>)}
        {matrix.domains.map((source) => (
          <>
            <strong key={`${source}:label`}>{source}</strong>
            {matrix.domains.map((target) => {
              const cell = matrix.cells.find((item) => item.sourceDomain === source && item.targetDomain === target)
              return (
                <div key={`${source}:${target}`} className={cell?.missingCount ? 'has-gap' : ''}>
                  <b>{cell?.relationshipCount ?? 0}</b>
                  <small>D {cell?.directCount ?? 0} / I {cell?.indirectCount ?? 0}</small>
                </div>
              )
            })}
          </>
        ))}
      </div>
    </section>
  )
}

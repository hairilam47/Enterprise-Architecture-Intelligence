import type { GraphSearchResult } from '../visualization/graphSearch'

type GraphSearchBoxProps = {
  query: string
  results: GraphSearchResult[]
  onQueryChange: (query: string) => void
  onSelectResult: (result: GraphSearchResult) => void
}

export function GraphSearchBox({
  query,
  results,
  onQueryChange,
  onSelectResult,
}: GraphSearchBoxProps) {
  return (
    <aside className="graph-search panel" aria-label="Graph search">
      <div className="panel__header">
        <p className="eyebrow">Graph Search</p>
        <h2>Find enterprise objects</h2>
      </div>

      <input
        className="graph-search-input"
        type="search"
        value={query}
        placeholder="Search label, type, layer, metadata"
        onChange={(event) => onQueryChange(event.target.value)}
      />

      {query && results.length === 0 ? (
        <p className="empty-state">No graph nodes match this search.</p>
      ) : (
        <ol className="search-results">
          {results.map((result) => (
            <li key={result.nodeId}>
              <button type="button" onClick={() => onSelectResult(result)}>
                <strong>{result.label}</strong>
                <span>
                  {result.type} · {result.layer ?? 'No layer'} · {result.matchReason}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}

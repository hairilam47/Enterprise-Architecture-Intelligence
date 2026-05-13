import type { EnterpriseNodeType, EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import { architectureLayers } from '../types/architecture'
import type { BottleneckSeverityFilter, WarningSeverityFilter } from '../visualization/graphFilters'

type GraphFilterPanelProps = {
  selectedNodeTypes: EnterpriseNodeType[]
  selectedRelationshipTypes: EnterpriseRelationshipType[]
  layerFilter: string
  warningSeverity: WarningSeverityFilter
  bottleneckSeverity: BottleneckSeverityFilter
  onNodeTypesChange: (types: EnterpriseNodeType[]) => void
  onRelationshipTypesChange: (types: EnterpriseRelationshipType[]) => void
  onLayerFilterChange: (layer: string) => void
  onWarningSeverityChange: (severity: WarningSeverityFilter) => void
  onBottleneckSeverityChange: (severity: BottleneckSeverityFilter) => void
}

const nodeTypes: EnterpriseNodeType[] = [
  'requirement',
  'api',
  'database',
  'service',
  'infrastructure',
  'incident',
  'testcase',
]

const relationshipTypes: EnterpriseRelationshipType[] = [
  'depends_on',
  'calls',
  'stores',
  'validated_by',
  'deployed_on',
  'causes',
]

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export function GraphFilterPanel({
  selectedNodeTypes,
  selectedRelationshipTypes,
  layerFilter,
  warningSeverity,
  bottleneckSeverity,
  onNodeTypesChange,
  onRelationshipTypesChange,
  onLayerFilterChange,
  onWarningSeverityChange,
  onBottleneckSeverityChange,
}: GraphFilterPanelProps) {
  return (
    <aside className="graph-filter-panel panel" aria-label="Graph filter panel">
      <div className="panel__header">
        <p className="eyebrow">Graph Filters</p>
        <h2>Scope the view</h2>
      </div>

      <section>
        <h3>Node type</h3>
        <div className="filter-chips">
          {nodeTypes.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                checked={selectedNodeTypes.includes(type)}
                onChange={() => onNodeTypesChange(toggleValue(selectedNodeTypes, type))}
              />
              {type}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>Relationship</h3>
        <div className="filter-chips">
          {relationshipTypes.map((type) => (
            <label key={type}>
              <input
                type="checkbox"
                checked={selectedRelationshipTypes.includes(type)}
                onChange={() => onRelationshipTypesChange(toggleValue(selectedRelationshipTypes, type))}
              />
              {type.replace('_', ' ')}
            </label>
          ))}
        </div>
      </section>

      <section className="filter-grid">
        <label>
          <span>Layer</span>
          <select value={layerFilter} onChange={(event) => onLayerFilterChange(event.target.value)}>
            <option value="">All layers</option>
            {architectureLayers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Warning severity</span>
          <select
            value={warningSeverity}
            onChange={(event) => onWarningSeverityChange(event.target.value as WarningSeverityFilter)}
          >
            <option value="any">Any</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label>
          <span>Bottleneck</span>
          <select
            value={bottleneckSeverity}
            onChange={(event) => onBottleneckSeverityChange(event.target.value as BottleneckSeverityFilter)}
          >
            <option value="any">Any</option>
            <option value="bottleneck">Bottleneck only</option>
          </select>
        </label>
      </section>
    </aside>
  )
}

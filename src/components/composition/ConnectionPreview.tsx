import type { EnterpriseRelationshipType } from '../../graph/enterpriseGraph'
import type { ConnectionRuleResult } from '../../composition/connectionRules'
import type { CompositionCanvasNode, CanvasPoint } from '../../composition/compositionTypes'

type ConnectionPreviewProps = {
  source?: CompositionCanvasNode
  target?: CompositionCanvasNode
  pointer?: CanvasPoint
  relationship: EnterpriseRelationshipType
  ruleResult: ConnectionRuleResult
  onCancel: () => void
}

export function ConnectionPreview({ source, target, pointer, relationship, ruleResult, onCancel }: ConnectionPreviewProps) {
  if (!source) return null

  const start = {
    x: source.position.x + source.size.width,
    y: source.position.y + source.size.height / 2,
  }
  const end = target
    ? { x: target.position.x, y: target.position.y + target.size.height / 2 }
    : pointer ?? { x: start.x + 120, y: start.y }
  const midX = (start.x + end.x) / 2
  const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`

  return (
    <g className={`connection-preview is-${ruleResult.severity}`}>
      <path d={path} />
      <circle cx={end.x} cy={end.y} r="7" />
      <foreignObject x={midX - 86} y={Math.min(start.y, end.y) - 58} width="172" height="68">
        <div className="connection-preview-card">
          <strong>{relationship}</strong>
          <span>{ruleResult.isAllowed ? 'Looks valid' : ruleResult.severity}</span>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </foreignObject>
    </g>
  )
}

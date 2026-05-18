import type { CompositionCanvasNode } from '../../composition/compositionTypes'
import type { MouseEvent, PointerEvent } from 'react'

const kindLabels: Record<CompositionCanvasNode['kind'], string> = {
  requirement: 'REQ',
  api: 'API',
  database: 'DB',
  service: 'SVC',
  infrastructure: 'INF',
  testcase: 'TST',
  incident: 'INC',
  group: 'GRP',
  environment: 'ENV',
  zone: 'ZONE',
}

type CanvasNodeCardProps = {
  node: CompositionCanvasNode
  isHovered: boolean
  isConnected: boolean
  onPointerDown: (event: PointerEvent<SVGGElement>) => void
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: (event: MouseEvent<SVGGElement>) => void
  onStartConnection: () => void
  onFinishConnection: () => void
  onDelete?: () => void
}

export function CanvasNodeCard({
  node,
  isHovered,
  isConnected,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onClick,
  onStartConnection,
  onFinishConnection,
  onDelete,
}: CanvasNodeCardProps) {
  const classes = [
    'composition-node',
    `is-${node.kind}`,
    `status-${node.status}`,
    isHovered ? 'is-hovered' : '',
    isConnected ? 'is-connected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <g
      className={classes}
      transform={`translate(${node.position.x} ${node.position.y})`}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      role="button"
      aria-label={`${node.kind} ${node.label}`}
      tabIndex={0}
    >
      <rect width={node.size.width} height={node.size.height} rx="8" />
      <circle cx="22" cy="24" r="13" />
      <text x="22" y="28" className="composition-node__type">{kindLabels[node.kind]}</text>
      <text x="44" y="25" className="composition-node__label">{node.label}</text>
      <text x="44" y="47" className="composition-node__meta">{node.layer ?? 'Canvas container'}</text>
      <foreignObject x={node.size.width - 146} y={node.size.height - 34} width="68" height="28">
        <button
          type="button"
          className="composition-connect-control"
          onClick={(event) => {
            event.stopPropagation()
            onStartConnection()
          }}
        >
          from
        </button>
      </foreignObject>
      <foreignObject x={node.size.width - 74} y={node.size.height - 34} width="68" height="28">
        <button
          type="button"
          className="composition-connect-control"
          onClick={(event) => {
            event.stopPropagation()
            onFinishConnection()
          }}
        >
          link
        </button>
      </foreignObject>
      {isHovered && onDelete && (
        <foreignObject x={node.size.width - 28} y={4} width="24" height="24">
          <button
            type="button"
            className="composition-node-delete"
            aria-label="Delete node"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            ✕
          </button>
        </foreignObject>
      )}
    </g>
  )
}

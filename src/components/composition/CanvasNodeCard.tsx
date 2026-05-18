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
  isEditing: boolean
  onPointerDown: (event: PointerEvent<SVGGElement>) => void
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: (event: MouseEvent<SVGGElement>) => void
  onDoubleClick: () => void
  onStartConnection: () => void
  onFinishConnection: () => void
  onPortDragStart: () => void
  onLabelCommit: (label: string) => void
  onContextMenuRequest: (clientX: number, clientY: number) => void
  onDelete?: () => void
}

export function CanvasNodeCard({
  node,
  isHovered,
  isConnected,
  isEditing,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onClick,
  onDoubleClick,
  onStartConnection,
  onFinishConnection,
  onPortDragStart,
  onLabelCommit,
  onContextMenuRequest,
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
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick() }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenuRequest(e.clientX, e.clientY) }}
      role="button"
      aria-label={`${node.kind} ${node.label}`}
      tabIndex={0}
    >
      <rect width={node.size.width} height={node.size.height} rx="8" />
      <circle cx="22" cy="24" r="13" />
      <text x="22" y="28" className="composition-node__type">{kindLabels[node.kind]}</text>
      {!isEditing && <text x="44" y="25" className="composition-node__label">{node.label}</text>}
      <text x="44" y="47" className="composition-node__meta">{node.layer ?? 'Canvas container'}</text>

      {/* Inline rename input */}
      {isEditing && (
        <foreignObject x={40} y={10} width={node.size.width - 52} height={28}>
          <input
            className="composition-node-rename-input"
            defaultValue={node.label}
            autoFocus
            onBlur={(e) => onLabelCommit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onLabelCommit((e.target as HTMLInputElement).value) }
              if (e.key === 'Escape') { onLabelCommit(node.label) }
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </foreignObject>
      )}

      {/* Output port — right edge */}
      <circle
        className="composition-port composition-port--output"
        cx={node.size.width}
        cy={node.size.height / 2}
        r="7"
        onPointerDown={(e) => { e.stopPropagation(); onPortDragStart() }}
      />
      {/* Input port — left edge */}
      <circle
        className="composition-port composition-port--input"
        cx={0}
        cy={node.size.height / 2}
        r="7"
        onPointerDown={(e) => { e.stopPropagation(); onFinishConnection() }}
      />

      {/* Legacy connection buttons */}
      <foreignObject x={node.size.width - 146} y={node.size.height - 34} width="68" height="28">
        <button
          type="button"
          className="composition-connect-control"
          onClick={(event) => { event.stopPropagation(); onStartConnection() }}
        >
          from
        </button>
      </foreignObject>
      <foreignObject x={node.size.width - 74} y={node.size.height - 34} width="68" height="28">
        <button
          type="button"
          className="composition-connect-control"
          onClick={(event) => { event.stopPropagation(); onFinishConnection() }}
        >
          link
        </button>
      </foreignObject>

      {/* Hover delete button */}
      {isHovered && onDelete && (
        <foreignObject x={node.size.width - 28} y={4} width="24" height="24">
          <button
            type="button"
            className="composition-node-delete"
            aria-label="Delete node"
            onClick={(event) => { event.stopPropagation(); onDelete() }}
          >
            ✕
          </button>
        </foreignObject>
      )}
    </g>
  )
}

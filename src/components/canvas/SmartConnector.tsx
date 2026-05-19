/**
 * SmartConnector renders an SVG path between two EA element shapes.
 * It calculates the nearest bounding-box edge points automatically.
 */

type Rect = { x: number; y: number; w: number; h: number }

type SmartConnectorProps = {
  sourceRect: Rect
  targetRect: Rect
  label?: string
  selected?: boolean
  color?: string
  dashed?: boolean
  onClick?: () => void
}

function closestEdgePoints(src: Rect, tgt: Rect): { x1: number; y1: number; x2: number; y2: number } {
  const sCx = src.x + src.w / 2
  const sCy = src.y + src.h / 2
  const tCx = tgt.x + tgt.w / 2
  const tCy = tgt.y + tgt.h / 2

  // Candidate connection points on each rect (top, bottom, left, right midpoints)
  const srcPts = [
    { x: sCx,        y: src.y        }, // top
    { x: sCx,        y: src.y + src.h }, // bottom
    { x: src.x,      y: sCy          }, // left
    { x: src.x + src.w, y: sCy       }, // right
  ]
  const tgtPts = [
    { x: tCx,        y: tgt.y        },
    { x: tCx,        y: tgt.y + tgt.h },
    { x: tgt.x,      y: tCy          },
    { x: tgt.x + tgt.w, y: tCy       },
  ]

  let best = { x1: sCx, y1: sCy, x2: tCx, y2: tCy, dist: Infinity }
  for (const sp of srcPts) {
    for (const tp of tgtPts) {
      const d = Math.hypot(sp.x - tp.x, sp.y - tp.y)
      if (d < best.dist) best = { x1: sp.x, y1: sp.y, x2: tp.x, y2: tp.y, dist: d }
    }
  }
  return best
}

export function SmartConnector({
  sourceRect,
  targetRect,
  label,
  selected = false,
  color = '#6B7280',
  dashed = false,
  onClick,
}: SmartConnectorProps) {
  const { x1, y1, x2, y2 } = closestEdgePoints(sourceRect, targetRect)

  // Cubic bezier control points — perpendicular pull
  const dx = x2 - x1
  const dy = y2 - y1
  const tension = Math.min(Math.max(Math.abs(dx), Math.abs(dy)) * 0.4, 120)
  const cx1 = x1 + (Math.abs(dx) > Math.abs(dy) ? tension : 0) * Math.sign(dx)
  const cy1 = y1 + (Math.abs(dy) >= Math.abs(dx) ? tension : 0) * Math.sign(dy)
  const cx2 = x2 - (Math.abs(dx) > Math.abs(dy) ? tension : 0) * Math.sign(dx)
  const cy2 = y2 - (Math.abs(dy) >= Math.abs(dx) ? tension : 0) * Math.sign(dy)

  const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Hit-area (wider invisible stroke for easier clicking) */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
      {/* Visible path */}
      <path
        d={d}
        fill="none"
        stroke={selected ? '#60A5FA' : color}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={dashed ? '6 3' : undefined}
        markerEnd="url(#ea-arrow)"
      />
      {label && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          fontSize={11}
          fill={selected ? '#60A5FA' : '#9CA3AF'}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  )
}

/** SVG <defs> block — include once per canvas SVG */
export function ConnectorDefs() {
  return (
    <defs>
      <marker id="ea-arrow" markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
      </marker>
      <marker id="ea-arrow-selected" markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#60A5FA" />
      </marker>
    </defs>
  )
}

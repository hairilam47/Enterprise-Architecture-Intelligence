import { useRef, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { useEAStore, selectActiveView, selectActiveViewElements, selectActiveViewRelationships } from '../../store/eaStore'
import type { EAElement, EARelationshipType } from '../../store/eaTypes'
import { LAYER_COLORS } from '../../store/eaTypes'
import { ARCHIMATE_ICONS, getIconForType } from '../../assets/archimateIcons'
import { SmartConnector, ConnectorDefs } from './SmartConnector'

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_W = 180
const DEFAULT_H = 60

// ── EA Shape Node ──────────────────────────────────────────────────────────

type EAShapeProps = {
  element: EAElement
  viewId: string
  selected: boolean
  highlighted: boolean
  onSelect: (e: MouseEvent, id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onConnectionStart: (id: string) => void
  onConnectionEnd: (id: string) => void
  pendingConnectionSourceId: string | null
}

function EAShape({
  element,
  viewId,
  selected,
  highlighted,
  onSelect,
  onDragEnd,
  onConnectionStart,
  onConnectionEnd,
  pendingConnectionSourceId,
}: EAShapeProps) {
  const pos = element.positions[viewId] ?? { x: 100, y: 100 }
  const size = element.sizes[viewId] ?? { w: DEFAULT_W, h: DEFAULT_H }
  const color = LAYER_COLORS[element.layer] ?? '#6B7280'
  const iconId = getIconForType(element.type)
  const icon = ARCHIMATE_ICONS[iconId]

  const dragOffset = useRef({ dx: 0, dy: 0 })
  const isDragging = useRef(false)

  const borderColor = selected ? '#60A5FA' : highlighted ? '#34D399' : color
  const bgOpacity = selected ? 0.18 : highlighted ? 0.12 : 0.08

  // Drag to move shape
  function handlePointerDown(e: React.PointerEvent<SVGGElement>) {
    if ((e.target as Element).closest('.connection-port')) return
    e.stopPropagation()
    isDragging.current = true
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    ;(e.currentTarget as SVGGElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<SVGGElement>) {
    if (!isDragging.current) return
    const x = e.clientX - dragOffset.current.dx
    const y = e.clientY - dragOffset.current.dy
    onDragEnd(element.id, x, y)
  }

  function handlePointerUp(e: React.PointerEvent<SVGGElement>) {
    if (!isDragging.current) return
    isDragging.current = false
    ;(e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId)
  }

  return (
    <g
      key={element.id}
      style={{ cursor: 'grab', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => onSelect(e, element.id)}
    >
      {/* Shape background */}
      <rect
        x={pos.x}
        y={pos.y}
        width={size.w}
        height={size.h}
        rx={6}
        fill={color}
        fillOpacity={bgOpacity}
        stroke={borderColor}
        strokeWidth={selected || highlighted ? 2 : 1}
      />

      {/* Layer strip at top */}
      <rect
        x={pos.x}
        y={pos.y}
        width={size.w}
        height={6}
        rx={6}
        fill={color}
        fillOpacity={0.7}
      />

      {/* Icon */}
      <g
        transform={`translate(${pos.x + 8}, ${pos.y + 12})`}
        style={{ color }}
        dangerouslySetInnerHTML={{ __html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">${icon}</svg>` }}
      />

      {/* Element name */}
      <foreignObject x={pos.x + 34} y={pos.y + 10} width={size.w - 42} height={size.h - 16}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#e0e0e0',
            lineHeight: '1.3',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {element.name}
        </div>
        <div style={{ fontSize: 9, color, opacity: 0.8, marginTop: 1 }}>{element.type}</div>
      </foreignObject>

      {/* Connection port — right edge midpoint */}
      <circle
        className="connection-port"
        cx={pos.x + size.w}
        cy={pos.y + size.h / 2}
        r={6}
        fill={pendingConnectionSourceId === element.id ? '#60A5FA' : color}
        fillOpacity={0.8}
        stroke="#fff"
        strokeWidth={1}
        style={{ cursor: 'crosshair' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (pendingConnectionSourceId && pendingConnectionSourceId !== element.id) {
            onConnectionEnd(element.id)
          } else {
            onConnectionStart(element.id)
          }
        }}
      />

      {/* Resize handle (bottom-right corner) */}
      <rect
        x={pos.x + size.w - 8}
        y={pos.y + size.h - 8}
        width={8}
        height={8}
        fill={color}
        fillOpacity={0.5}
        style={{ cursor: 'se-resize' }}
      />
    </g>
  )
}

// ── Relationship type selector (mini dropdown) ─────────────────────────────

const REL_TYPES: EARelationshipType[] = [
  'Association', 'Serving', 'Realization', 'Assignment',
  'Composition', 'Aggregation', 'Triggering', 'Flow', 'Access',
]

type RelTypeSelectorProps = {
  onSelect: (t: EARelationshipType) => void
  onCancel: () => void
  x: number
  y: number
}

function RelTypeSelector({ onSelect, onCancel, x, y }: RelTypeSelectorProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: '#1e1e3a',
        border: '1px solid #3a3a6a',
        borderRadius: 8,
        padding: 8,
        zIndex: 1000,
        minWidth: 180,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6, padding: '0 4px' }}>Relationship type</div>
      {REL_TYPES.map((t) => (
        <div
          key={t}
          onClick={() => onSelect(t)}
          style={{
            padding: '5px 10px',
            borderRadius: 4,
            fontSize: 12,
            color: '#ccc',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {t}
        </div>
      ))}
      <div
        onClick={onCancel}
        style={{ padding: '5px 10px', borderRadius: 4, fontSize: 12, color: '#555', cursor: 'pointer', marginTop: 4, borderTop: '1px solid #2a2a4a' }}
      >
        Cancel
      </div>
    </div>
  )
}

// ── EACanvas ───────────────────────────────────────────────────────────────

type PendingConnection = {
  sourceId: string
  targetId?: string
  mouseX: number
  mouseY: number
}

export function EACanvas() {
  const elements = useEAStore(selectActiveViewElements)
  const relationships = useEAStore(selectActiveViewRelationships)
  const activeView = useEAStore(selectActiveView)
  const selectedIds = useEAStore((s) => s.project.selectedElementIds)
  const highlightedIds = useEAStore((s) => s.project.highlightedElementIds)
  const addElement = useEAStore((s) => s.addElement)
  const addRelationship = useEAStore((s) => s.addRelationship)
  const setSelection = useEAStore((s) => s.setSelection)
  const updateElementPosition = useEAStore((s) => s.updateElementPosition)

  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const [pending, setPending] = useState<PendingConnection | null>(null)
  const [relSelector, setRelSelector] = useState<{ sourceId: string; targetId: string; x: number; y: number } | null>(null)

  // ── Drop from palette ────────────────────────────────────────────────────
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/ea-element-type') as EAElement['type']
    const label = e.dataTransfer.getData('application/ea-element-label')
    if (!type || !activeView) return

    // Convert drop coordinates to SVG canvas space
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const state = transformRef.current?.state
    const scale = state?.scale ?? 1
    const tx = state?.positionX ?? 0
    const ty = state?.positionY ?? 0
    const x = (e.clientX - rect.left - tx) / scale
    const y = (e.clientY - rect.top - ty) / scale

    addElement(type, label, { viewId: activeView.id, position: { x, y } })
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // ── Selection ────────────────────────────────────────────────────────────
  function handleElementSelect(e: MouseEvent, id: string) {
    e.stopPropagation()
    setSelection([id])
  }

  function handleCanvasClick() {
    if (!pending) setSelection([])
  }

  // ── Drag to move ─────────────────────────────────────────────────────────
  function handleDragEnd(id: string, x: number, y: number) {
    if (!activeView) return
    const state = transformRef.current?.state
    const scale = state?.scale ?? 1
    const tx = state?.positionX ?? 0
    const ty = state?.positionY ?? 0
    const svgRect = svgRef.current?.getBoundingClientRect()
    if (!svgRect) return
    const svgX = (x - svgRect.left - tx) / scale
    const svgY = (y - svgRect.top - ty) / scale
    updateElementPosition(id, activeView.id, { x: svgX, y: svgY })
  }

  // ── Smart connections ────────────────────────────────────────────────────
  function handleConnectionStart(id: string) {
    setPending({ sourceId: id, mouseX: 0, mouseY: 0 })
  }

  function handleConnectionEnd(targetId: string) {
    if (!pending || pending.sourceId === targetId) {
      setPending(null)
      return
    }
    setRelSelector({
      sourceId: pending.sourceId,
      targetId,
      x: (window.innerWidth / 2) - 90,
      y: (window.innerHeight / 2) - 160,
    })
    setPending(null)
  }

  function handleRelTypeSelect(relType: EARelationshipType) {
    if (!relSelector) return
    addRelationship(relType, relSelector.sourceId, relSelector.targetId)
    setRelSelector(null)
  }

  // ── Rect helper ──────────────────────────────────────────────────────────
  function rectFor(el: EAElement) {
    const pos = el.positions[activeView?.id ?? ''] ?? { x: 0, y: 0 }
    const size = el.sizes[activeView?.id ?? ''] ?? { w: DEFAULT_W, h: DEFAULT_H }
    return { x: pos.x, y: pos.y, w: size.w, h: size.h }
  }

  const elementMap = Object.fromEntries(elements.map((e) => [e.id, e]))

  return (
    <div
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--color-canvas-bg, #0f0f1a)' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <TransformWrapper
        ref={transformRef}
        minScale={0.1}
        maxScale={4}
        initialScale={1}
        panning={{ excluded: ['ea-shape', 'connection-port'] }}
        wheel={{ activationKeys: [] }}
        pinch={{ step: 5 }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '4000px', height: '4000px' }}
        >
          <svg
            ref={svgRef}
            width={4000}
            height={4000}
            style={{ display: 'block' }}
            onClick={handleCanvasClick}
          >
            <ConnectorDefs />

            {/* Grid background */}
            <defs>
              <pattern id="ea-grid" width={40} height={40} patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
              </pattern>
            </defs>
            <rect width={4000} height={4000} fill="url(#ea-grid)" />

            {/* Relationships */}
            {relationships.map((rel) => {
              const src = elementMap[rel.sourceId]
              const tgt = elementMap[rel.targetId]
              if (!src || !tgt) return null
              return (
                <SmartConnector
                  key={rel.id}
                  sourceRect={rectFor(src)}
                  targetRect={rectFor(tgt)}
                  label={rel.label ?? rel.type}
                  selected={rel.id === (useEAStore.getState().project.selectedRelationshipId)}
                  dashed={rel.type === 'Realization' || rel.type === 'Serving'}
                  onClick={() => useEAStore.getState().setSelection([], rel.id)}
                />
              )
            })}

            {/* Elements */}
            {elements.map((el) => (
              <EAShape
                key={el.id}
                element={el}
                viewId={activeView?.id ?? ''}
                selected={selectedIds.includes(el.id)}
                highlighted={highlightedIds.includes(el.id)}
                onSelect={handleElementSelect}
                onDragEnd={handleDragEnd}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
                pendingConnectionSourceId={pending?.sourceId ?? null}
              />
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {/* Zoom controls overlay */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { label: '+', action: () => transformRef.current?.zoomIn() },
          { label: '−', action: () => transformRef.current?.zoomOut() },
          { label: '⊡', action: () => transformRef.current?.resetTransform() },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ccc', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {pending && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', background: '#1e1e3a', border: '1px solid #60A5FA', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#60A5FA' }}>
          Click a connection port on the target element to complete the relationship
          <button onClick={() => setPending(null)} style={{ marginLeft: 10, background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {relSelector && (
        <RelTypeSelector
          x={relSelector.x}
          y={relSelector.y}
          onSelect={handleRelTypeSelect}
          onCancel={() => setRelSelector(null)}
        />
      )}
    </div>
  )
}

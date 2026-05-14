import type { CompositionCanvasGroup } from '../../composition/compositionTypes'

type CanvasGroupProps = {
  group: CompositionCanvasGroup
  isSelected?: boolean
  isHovered?: boolean
  onSelect?: () => void
  onHover?: () => void
  onLeave?: () => void
}

export function CanvasGroup({ group, isSelected, isHovered, onSelect, onHover, onLeave }: CanvasGroupProps) {
  return (
    <g
      className={`composition-group is-${group.kind} ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
      transform={`translate(${group.position.x} ${group.position.y})`}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
      onPointerEnter={onHover}
      onPointerLeave={onLeave}
      role="button"
      tabIndex={0}
      aria-label={`Group ${group.label}`}
    >
      <rect width={group.size.width} height={group.size.height} rx="8" style={{ stroke: group.color }} />
      <text x="16" y="24">{group.label}</text>
      <text x="16" y="44">{group.kind.replaceAll('_', ' ')}</text>
    </g>
  )
}

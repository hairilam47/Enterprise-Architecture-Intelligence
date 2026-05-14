import type { ContextualHintModel } from '../../workflow/contextualHints'

type ContextualHintProps = {
  hint: ContextualHintModel
  onDismiss: (hintId: string) => void
  onAction?: () => void
}

export function ContextualHint({ hint, onDismiss, onAction }: ContextualHintProps) {
  return (
    <article className={`contextual-hint is-${hint.severity}`}>
      <div>
        <span>{hint.mode}</span>
        <strong>{hint.title}</strong>
        <p>{hint.description}</p>
      </div>
      <div className="contextual-hint__actions">
        {hint.actionLabel && onAction ? <button type="button" onClick={onAction}>{hint.actionLabel}</button> : null}
        <button type="button" onClick={() => onDismiss(hint.id)}>Dismiss</button>
      </div>
    </article>
  )
}

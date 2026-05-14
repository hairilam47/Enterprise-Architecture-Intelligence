import type { ContextualHintModel } from '../../workflow/contextualHints'
import type { WorkflowStep } from '../../workflow/workflowTypes'
import { ContextualHint } from './ContextualHint'
import { NextStepCard } from './NextStepCard'

type SuggestionPanelProps = {
  nextStep?: WorkflowStep
  hints: ContextualHintModel[]
  onRunNextStep: () => void
  onRunHint: (hint: ContextualHintModel) => void
  onDismiss: (hintId: string) => void
}

export function SuggestionPanel({
  nextStep,
  hints,
  onRunNextStep,
  onRunHint,
  onDismiss,
}: SuggestionPanelProps) {
  return (
    <section className="suggestion-panel" aria-label="Contextual guidance">
      <NextStepCard step={nextStep} onAction={onRunNextStep} onDismiss={onDismiss} />
      {hints.slice(0, 2).map((hint) => (
        <ContextualHint
          key={hint.id}
          hint={hint}
          onDismiss={onDismiss}
          onAction={hint.actionLabel ? () => onRunHint(hint) : undefined}
        />
      ))}
    </section>
  )
}

type WorkspaceGoalStepProps = {
  value: string
  onChange: (goal: string) => void
}

const goals = ['Enterprise Architecture', 'Operational Intelligence', 'Governance']

export function WorkspaceGoalStep({ value, onChange }: WorkspaceGoalStepProps) {
  return (
    <section className="wizard-step">
      <h3>What are you mapping?</h3>
      <div className="wizard-choice-grid">
        {goals.map((goal) => (
          <button key={goal} type="button" className={value === goal ? 'is-active' : ''} onClick={() => onChange(goal)}>
            {goal}
          </button>
        ))}
      </div>
    </section>
  )
}

type EmptyStateGuidanceProps = {
  mode: 'build' | 'analyze' | 'replay'
  onPrimaryAction: () => void
}

const copy = {
  build: {
    title: 'Start by placing the first architecture component.',
    description: 'A business requirement, service, API, or infrastructure component is enough to begin.',
    action: 'Open starter wizard',
  },
  analyze: {
    title: 'Build relationships first to unlock graph intelligence.',
    description: 'Analysis becomes useful once entities are connected through enterprise relationships.',
    action: 'Go to Build',
  },
  replay: {
    title: 'Create checkpoints to begin replayable workspace history.',
    description: 'Replay works best once architecture changes have named recovery points.',
    action: 'Create checkpoint',
  },
}

export function EmptyStateGuidance({ mode, onPrimaryAction }: EmptyStateGuidanceProps) {
  const content = copy[mode]
  return (
    <section className="empty-state-guidance">
      <p className="eyebrow">{mode}</p>
      <h2>{content.title}</h2>
      <p>{content.description}</p>
      <button type="button" onClick={onPrimaryAction}>{content.action}</button>
    </section>
  )
}

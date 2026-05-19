import type { CollaborationState } from './yBinding'

interface Props {
  collab: CollaborationState
}

export function PresenceIndicator({ collab }: Props) {
  if (!collab.active) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        background: 'rgba(16,185,129,0.12)',
        borderRadius: 12,
        fontSize: 12,
        color: '#10B981',
        whiteSpace: 'nowrap',
      }}
      title={`Live collaboration — ${collab.peers} other ${collab.peers === 1 ? 'peer' : 'peers'} connected`}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
      Live
      {collab.peers > 0 && (
        <span style={{ background: '#10B981', color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 10 }}>
          +{collab.peers}
        </span>
      )}
    </div>
  )
}

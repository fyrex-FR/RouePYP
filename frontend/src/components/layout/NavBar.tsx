import { useBreakStore } from '../../stores/breakStore'
import type { AppView } from '../../types'

const tabs: { id: AppView; label: string; icon: string }[] = [
  { id: 'wheel', label: 'Roue', icon: '🎡' },
  { id: 'admin', label: 'Admin', icon: '⚙️' },
  { id: 'history', label: 'Historique', icon: '📋' },
]

export default function NavBar() {
  const { view, setView, givePlayers, paidSpots } = useBreakStore()

  return (
    <nav
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img
          src="/shaq.jpg"
          alt="Shaq"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--accent)',
            boxShadow: '0 0 10px var(--accent-glow)',
          }}
        />
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--accent-bright)',
            letterSpacing: '-0.5px',
          }}
          className="text-glow-purple"
        >
          Rouuuuue
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginLeft: 4,
            fontStyle: 'italic',
          }}
        >
          Pick Your Player
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: view === tab.id ? '1px solid var(--accent)' : '1px solid transparent',
              background: view === tab.id ? 'rgba(168,85,247,0.15)' : 'transparent',
              color: view === tab.id ? 'var(--accent-bright)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: view === tab.id ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span>
          <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>{givePlayers.length}</span>{' '}
          give
        </span>
        <span>
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{paidSpots.length}</span>{' '}
          spots
        </span>
      </div>
    </nav>
  )
}

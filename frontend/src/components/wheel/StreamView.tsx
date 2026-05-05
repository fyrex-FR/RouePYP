import WheelCanvas from './WheelCanvas'
import type { DrawResult } from '../../types'

interface Props {
  segments: string[]
  selectedSpot: string
  liveResults: (DrawResult & { spot: string })[]
  winner: string | null
  onExit: () => void
  triggerSpin: boolean
  onResult: (winner: string, index: number) => void
  onSpinComplete: () => void
}

export default function StreamView({ segments, selectedSpot, liveResults, winner, onExit, triggerSpin, onResult, onSpinComplete }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
        padding: 40,
      }}
    >
      {/* Exit button */}
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid #ef4444',
          borderRadius: 10,
          color: '#ef4444',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 10,
        }}
      >
        ✕ Quitter stream
      </button>

      {/* Left — Wheel + spot name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            Pick Your Player — Give Edition
          </div>
          {selectedSpot && (
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: 'var(--neon-cyan)',
                textShadow: '0 0 20px var(--neon-cyan-glow)',
              }}
            >
              💰 {selectedSpot}
            </div>
          )}
          {winner && (
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: 'var(--accent-bright)',
                marginTop: 12,
                animation: 'winner-pop 0.5s cubic-bezier(0.36,0.07,0.19,0.97)',
                textShadow: '0 0 20px var(--accent-glow)',
              }}
            >
              🎁 {winner}
            </div>
          )}
        </div>

        <WheelCanvas
          segments={segments}
          onResult={onResult}
          triggerSpin={triggerSpin}
          onSpinComplete={onSpinComplete}
        />

        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 4, padding: '2px 6px', marginRight: 6 }}>Espace</kbd>
          Lancer &nbsp;·&nbsp;
          <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 4, padding: '2px 6px', marginLeft: 6 }}>Entrée</kbd>
          Suivant
        </div>
      </div>

      {/* Right — Live recap */}
      {liveResults.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 320,
            maxHeight: '80vh',
            background: 'var(--bg-card)',
            border: '1px solid rgba(168,85,247,0.3)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--accent-bright)',
            }}
          >
            📊 Récap live ({liveResults.length})
          </div>
          <div style={{ overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {liveResults.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  animation: i === liveResults.length - 1 ? 'slide-up 0.3s ease' : 'none',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 22 }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--neon-green)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🎁 {r.give_player}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                <span style={{ fontSize: 13, color: 'var(--neon-cyan)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  💰 {r.paid_player}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

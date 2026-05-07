import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  winner: string
  spotName: string
  drawIndex: number
  totalDraws: number
  onNext: () => void
  onClose: () => void
}

export default function ResultOverlay({ winner, spotName, drawIndex, totalDraws, onNext, onClose }: Props) {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'],
    })
  }, [])

  const hasMore = drawIndex < totalDraws - 1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
      onClick={hasMore ? onNext : onClose}
    >
      <div
        className="result-card"
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--accent)',
          borderRadius: 24,
          padding: '48px 56px',
          textAlign: 'center',
          maxWidth: 480,
          width: '90%',
          boxShadow: '0 0 60px var(--accent-glow)',
          animation: 'bounce-in 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>

        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Spot :{' '}
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{spotName}</span>
          {totalDraws > 1 && (
            <span style={{ marginLeft: 8 }}>
              — Tirage {drawIndex + 1}/{totalDraws}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 24,
          }}
        >
          Joueur give attribué à :
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: 'var(--accent-bright)',
            marginBottom: 8,
            letterSpacing: '-1px',
            lineHeight: 1.1,
          }}
          className="text-glow-purple"
        >
          {winner}
        </div>

        <div
          style={{
            width: 80,
            height: 3,
            background: 'linear-gradient(90deg, var(--accent), var(--neon-cyan))',
            borderRadius: 2,
            margin: '20px auto 28px',
          }}
        />

        <div className="result-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {hasMore ? (
            <button
              onClick={onNext}
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--neon-cyan))',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                padding: '12px 28px',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 700,
                boxShadow: '0 4px 20px var(--accent-glow)',
              }}
            >
              Tirage suivant ➜
            </button>
          ) : (
            <button
              onClick={onNext}
              style={{
                background: 'linear-gradient(135deg, var(--neon-green), var(--neon-cyan))',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                padding: '12px 28px',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 700,
                boxShadow: '0 4px 20px var(--neon-cyan-glow)',
              }}
            >
              Terminer ✓
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-bright)',
              borderRadius: 12,
              color: 'var(--text-secondary)',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

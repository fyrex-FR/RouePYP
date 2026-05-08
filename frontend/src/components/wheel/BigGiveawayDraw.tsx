import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  segments: string[]
  onResult: (winner: string, index: number) => void
  triggerSpin: boolean
  onSpinComplete: () => void
}

const COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#f97316', '#6366f1', '#14b8a6']

export default function BigGiveawayDraw({ segments, onResult, triggerSpin, onSpinComplete }: Props) {
  const [rollingName, setRollingName] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [isRolling, setIsRolling] = useState(false)
  const timerRef = useRef<number | null>(null)
  const rollingRef = useRef(false)

  const previewNames = useMemo(() => {
    if (segments.length <= 12) return segments
    const step = Math.max(1, Math.floor(segments.length / 12))
    return segments.filter((_, i) => i % step === 0).slice(0, 12)
  }, [segments])

  useEffect(() => {
    if (!segments.length) {
      setRollingName('Aucun joueur')
      return
    }
    if (!isRolling) {
      setRollingName('')
    }
  }, [segments, isRolling])

  useEffect(() => {
    if (!triggerSpin || !segments.length || rollingRef.current) return

    const winnerIndex = Math.floor(Math.random() * segments.length)
    const winner = segments[winnerIndex]
    const duration = 4200 + Math.random() * 1200
    const startedAt = performance.now()
    rollingRef.current = true
    setIsRolling(true)
    setProgress(0)

    function tick(now: number) {
      const elapsed = now - startedAt
      const t = Math.min(elapsed / duration, 1)
      // Keep the beginning frantic, then slow the name changes down.
      const ease = 1 - Math.pow(1 - t, 3)
      setProgress(ease)

      if (t < 1) {
        setRollingName(segments[Math.floor(Math.random() * segments.length)])
        const delay = 28 + ease * 180
        timerRef.current = window.setTimeout(() => requestAnimationFrame(tick), delay)
        return
      }

      setRollingName(winner)
      rollingRef.current = false
      setIsRolling(false)
      onResult(winner, winnerIndex)
      onSpinComplete()
    }

    requestAnimationFrame(tick)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      rollingRef.current = false
    }
  }, [triggerSpin, segments, onResult, onSpinComplete])

  return (
    <div
      className="big-giveaway-draw"
      style={{
        width: 'min(620px, calc(100vw - 32px))',
        minHeight: 460,
        borderRadius: 32,
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 35%, rgba(168,85,247,0.28), rgba(6,182,212,0.10) 36%, rgba(10,10,15,0.96) 72%)',
        border: '1px solid var(--border-bright)',
        boxShadow: '0 0 70px rgba(168,85,247,0.24), inset 0 0 80px rgba(6,182,212,0.08)',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -120,
          background: `conic-gradient(${COLORS.map((c, i) => `${c} ${i * 45}deg ${(i + 1) * 45}deg`).join(',')})`,
          opacity: 0.16,
          filter: 'blur(2px)',
          animation: isRolling ? 'spin-bg 2.8s linear infinite' : 'spin-bg 18s linear infinite',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800 }}>
          Big Giveaway Mode
        </div>
        <div style={{ fontSize: 44, fontWeight: 950, color: 'var(--accent-bright)', textShadow: '0 0 28px var(--accent-glow)', marginTop: 6 }}>
          🎁 {segments.length.toLocaleString('fr-FR')} joueurs en give
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Trop de joueurs pour une roue lisible — la géométrie a été mise au coin.
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 520,
          borderRadius: 22,
          padding: '24px 22px',
          background: 'rgba(0,0,0,0.34)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 0 28px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, fontWeight: 800 }}>
          {isRolling ? 'Tirage en cours…' : 'En attente du lancement'}
        </div>
        <div
          style={{
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: 'clamp(26px, 6vw, 44px)',
            lineHeight: 1.08,
            fontWeight: 950,
            color: isRolling ? 'var(--neon-cyan)' : 'var(--text-primary)',
            textShadow: isRolling ? '0 0 22px var(--neon-cyan-glow)' : 'none',
            transition: 'color 0.15s ease',
          }}
        >
          {isRolling ? rollingName : 'Appuie sur LANCER'}
        </div>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 18 }}>
          <div
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: '100%',
              borderRadius: 99,
              background: 'linear-gradient(90deg, var(--accent), var(--neon-cyan), var(--neon-yellow))',
              boxShadow: '0 0 18px var(--accent-glow)',
              transition: 'width 0.12s linear',
            }}
          />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 540 }}>
        {previewNames.map((name) => (
          <span
            key={name}
            style={{
              maxWidth: 138,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              borderRadius: 999,
              padding: '5px 10px',
              fontSize: 11,
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

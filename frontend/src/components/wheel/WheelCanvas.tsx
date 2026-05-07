import { useEffect, useRef, useState } from 'react'
import { useWheel } from '../../hooks/useWheel'

interface Props {
  segments: string[]
  onResult: (winner: string, index: number) => void
  triggerSpin: boolean
  onSpinComplete: () => void
}

export default function WheelCanvas({ segments, onResult, triggerSpin, onSpinComplete }: Props) {
  const { canvasRef, draw, spin, isSpinning } = useWheel()
  const [showGif, setShowGif] = useState(false)
  const [currentGif, setCurrentGif] = useState<string | null>(null)
  const gifsRef = useRef<string[]>([])
  const usedGifsRef = useRef<string[]>([])

  useEffect(() => {
    fetch('/gifs.json')
      .then((r) => r.json())
      .then((list: string[]) => { gifsRef.current = list })
      .catch(() => { gifsRef.current = ['hamster.gif'] })
  }, [])

  function pickGif(): string {
    const all = gifsRef.current
    if (!all.length) return 'hamster.gif'
    const remaining = all.filter((g) => !usedGifsRef.current.includes(g))
    const pool = remaining.length > 0 ? remaining : all
    const picked = pool[Math.floor(Math.random() * pool.length)]
    // Réinitialise si on a tout utilisé
    if (remaining.length <= 1) usedGifsRef.current = [picked]
    else usedGifsRef.current = [...usedGifsRef.current, picked]
    return picked
  }

  useEffect(() => {
    draw(segments, 0)
  }, [segments, draw])

  useEffect(() => {
    if (!triggerSpin) return
    const gif = pickGif()
    setCurrentGif(gif)
    setShowGif(true)
    spin(segments, (winner, idx) => {
      setShowGif(false)
      onResult(winner, idx)
      onSpinComplete()
    })
  }, [triggerSpin, segments, spin, onResult, onSpinComplete])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          background: 'transparent',
          border: '2px solid var(--accent)',
          boxShadow: '0 0 30px var(--accent-glow), inset 0 0 30px var(--accent-glow)',
          pointerEvents: 'none',
          animation: isSpinning.current ? 'pulse-glow 1s ease-in-out infinite' : 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        width={460}
        height={460}
        style={{ borderRadius: '50%', display: 'block' }}
      />
      {showGif && currentGif && (
        <img
          key={currentGif}
          src={`/${currentGif}`}
          alt=""
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200,
            height: 200,
            objectFit: 'contain',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.9))',
          }}
        />
      )}
    </div>
  )
}

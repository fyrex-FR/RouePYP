import { useRef, useCallback } from 'react'

export interface WheelConfig {
  segments: string[]
  onResult: (winner: string, index: number) => void
}

const NEON_COLORS = [
  ['#a855f7', '#7c3aed'],
  ['#06b6d4', '#0891b2'],
  ['#ec4899', '#be185d'],
  ['#10b981', '#059669'],
  ['#f59e0b', '#d97706'],
  ['#f97316', '#ea580c'],
  ['#6366f1', '#4f46e5'],
  ['#14b8a6', '#0d9488'],
]

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const spinningRef = useRef(false)

  const draw = useCallback(
    (segments: string[], currentAngle: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const size = canvas.width
      const cx = size / 2
      const cy = size / 2
      const radius = cx - 10

      ctx.clearRect(0, 0, size, size)

      if (!segments.length) {
        ctx.fillStyle = '#1a1a26'
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#55556a'
        ctx.font = `bold 16px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Aucun joueur', cx, cy)
        return
      }

      const segAngle = (Math.PI * 2) / segments.length

      segments.forEach((label, i) => {
        const startAngle = currentAngle + i * segAngle
        const endAngle = startAngle + segAngle
        const colors = NEON_COLORS[i % NEON_COLORS.length]

        // Segment fill
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        grad.addColorStop(0, colors[0] + '99')
        grad.addColorStop(1, colors[0])
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fill()

        // Segment border
        ctx.strokeStyle = '#0a0a0f'
        ctx.lineWidth = 2
        ctx.stroke()

        // Text
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(startAngle + segAngle / 2)
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'

        const maxWidth = radius * 0.72
        const fontSize = Math.min(14, Math.max(9, 140 / segments.length))
        ctx.font = `bold ${fontSize}px Inter, sans-serif`
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = colors[0]
        ctx.shadowBlur = 6

        let text = label
        const measured = ctx.measureText(text)
        if (measured.width > maxWidth) {
          while (ctx.measureText(text + '…').width > maxWidth && text.length > 3) {
            text = text.slice(0, -1)
          }
          text = text + '…'
        }
        ctx.fillText(text, radius - 14, 0)
        ctx.restore()
      })

      // Center circle
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28)
      centerGrad.addColorStop(0, '#c084fc')
      centerGrad.addColorStop(1, '#7c3aed')
      ctx.beginPath()
      ctx.arc(cx, cy, 28, 0, Math.PI * 2)
      ctx.fillStyle = centerGrad
      ctx.fill()
      ctx.strokeStyle = '#0a0a0f'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🎰', cx, cy)

      // Needle (top center)
      const needleX = cx
      const needleY = 6
      ctx.beginPath()
      ctx.moveTo(needleX - 10, needleY)
      ctx.lineTo(needleX + 10, needleY)
      ctx.lineTo(needleX, needleY + 30)
      ctx.closePath()
      ctx.fillStyle = '#f59e0b'
      ctx.fill()
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.shadowBlur = 0
    },
    []
  )

  const spin = useCallback(
    (segments: string[], onResult: (winner: string, index: number) => void) => {
      if (spinningRef.current || !segments.length) return
      spinningRef.current = true

      const winnerIndex = Math.floor(Math.random() * segments.length)
      const segAngle = (Math.PI * 2) / segments.length

      // We want the needle (top = -PI/2) to point at winnerIndex segment center
      // currentAngle is the rotation of the wheel; segment i is at currentAngle + i*segAngle
      // We want: currentAngle + winnerIndex*segAngle + segAngle/2 = -PI/2 + 2kPI
      // => currentAngle = -PI/2 - winnerIndex*segAngle - segAngle/2 + 2kPI

      const extraSpins = 5 + Math.floor(Math.random() * 4)
      const targetOffset = -Math.PI / 2 - winnerIndex * segAngle - segAngle / 2
      const targetAngle = extraSpins * Math.PI * 2 + targetOffset

      const duration = 4000 + Math.random() * 1500
      const startTime = performance.now()
      const startAngle = 0

      function frame(now: number) {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const eased = easeOutCubic(t)
        const currentAngle = startAngle + targetAngle * eased

        draw(segments, currentAngle)

        if (t < 1) {
          rafRef.current = requestAnimationFrame(frame)
        } else {
          spinningRef.current = false
          // Normalize final angle to identify winner
          onResult(segments[winnerIndex], winnerIndex)
        }
      }

      draw(segments, 0)
      rafRef.current = requestAnimationFrame(frame)
    },
    [draw]
  )

  const stopSpin = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    spinningRef.current = false
  }, [])

  return { canvasRef, draw, spin, stopSpin, isSpinning: spinningRef }
}

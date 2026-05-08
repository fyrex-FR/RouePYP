import BigGiveawayDraw from './BigGiveawayDraw'
import WheelCanvas from './WheelCanvas'

interface Props {
  segments: string[]
  onResult: (winner: string, index: number) => void
  triggerSpin: boolean
  onSpinComplete: () => void
}

const HIDE_LABELS_AT = 81
const BIG_GIVEAWAY_AT = 201

export default function GiveawayDisplay({ segments, onResult, triggerSpin, onSpinComplete }: Props) {
  const count = segments.length

  if (count >= BIG_GIVEAWAY_AT) {
    return (
      <BigGiveawayDraw
        segments={segments}
        onResult={onResult}
        triggerSpin={triggerSpin}
        onSpinComplete={onSpinComplete}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <WheelCanvas
        segments={segments}
        onResult={onResult}
        triggerSpin={triggerSpin}
        onSpinComplete={onSpinComplete}
        showLabels={count < HIDE_LABELS_AT}
      />
      {count >= HIDE_LABELS_AT && (
        <div
          style={{
            maxWidth: 460,
            color: 'var(--text-muted)',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {count.toLocaleString('fr-FR')} participants — noms masqués pour garder une roue lisible. Le gagnant s’affiche au reveal.
        </div>
      )}
    </div>
  )
}

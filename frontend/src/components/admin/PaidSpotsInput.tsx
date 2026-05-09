import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useBreakStore } from '../../stores/breakStore'

function normalizeGiveCount(value: number | string | null | undefined) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.min(20, Math.floor(parsed))
}

export default function PaidSpotsInput() {
  const { paidSpots, allPaidSpots, setPaidSpots, addPaidSpot, loadSessionSpots } = useBreakStore()
  const [bulk, setBulk] = useState('')
  const [singleName, setSingleName] = useState('')
  const [singleGiveCount, setSingleGiveCount] = useState(1)
  const [confirmClear, setConfirmClear] = useState(false)

  function handleBulkImport() {
    // Format accepté : "Nom 5" ou "Nom;5" ou juste "Nom" (giveCount=1 par défaut)
    const lines = bulk.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return
    const existing = new Set((allPaidSpots.length ? allPaidSpots : paidSpots).map((s) => s.name.toLowerCase()))
    const spots = lines
      .map((line) => {
        const match = line.match(/^(.+?)[\s;]+(\d+)$/)
        const name = match ? match[1].trim() : line
        const giveCount = normalizeGiveCount(match ? match[2] : 1)
        return { name, giveCount }
      })
      .filter(({ name }) => !existing.has(name.toLowerCase()))
      .map(({ name, giveCount }) => ({ id: nanoid(), name, giveCount }))
    loadSessionSpots([...(allPaidSpots.length ? allPaidSpots : paidSpots), ...spots], [...paidSpots, ...spots])
    setBulk('')
  }

  function handleAddSingle() {
    const name = singleName.trim()
    if (!name) return
    addPaidSpot(name, normalizeGiveCount(singleGiveCount))
    setSingleName('')
    setSingleGiveCount(1)
  }

  function handleUpdateGiveCount(id: string, giveCount: number | string) {
    loadSessionSpots(
      (allPaidSpots.length ? allPaidSpots : paidSpots).map((s) => s.id === id ? { ...s, giveCount: normalizeGiveCount(giveCount) } : s),
      paidSpots.map((s) => s.id === id ? { ...s, giveCount: normalizeGiveCount(giveCount) } : s)
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>💰</span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--neon-cyan)' }}>
          Spots payants
        </h2>
        <span
          style={{
            background: 'rgba(6,182,212,0.15)',
            border: '1px solid var(--neon-cyan)',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 13,
            color: 'var(--neon-cyan)',
          }}
        >
          {paidSpots.length}
        </span>
      </div>

      {/* Bulk import */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Coller une liste — format : <code style={{ color: 'var(--neon-cyan)' }}>Nom 5</code> ou <code style={{ color: 'var(--neon-cyan)' }}>Nom;5</code> (nombre de gives)
        </label>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={'LeBron James 3\nSteph Curry;5\nKevin Durant'}
          rows={5}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-bright)',
            borderRadius: 8,
            padding: '10px 12px',
            color: 'var(--text-primary)',
            fontSize: 14,
            resize: 'vertical',
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
        <button
          onClick={handleBulkImport}
          disabled={!bulk.trim()}
          style={{
            background: bulk.trim() ? 'rgba(6,182,212,0.2)' : 'transparent',
            border: `1px solid ${bulk.trim() ? 'var(--neon-cyan)' : 'var(--border)'}`,
            borderRadius: 8,
            color: bulk.trim() ? 'var(--neon-cyan)' : 'var(--text-muted)',
            padding: '8px 16px',
            cursor: bulk.trim() ? 'pointer' : 'not-allowed',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          Importer la liste
        </button>
      </div>

      {/* Single add */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={singleName}
          onChange={(e) => setSingleName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSingle()}
          placeholder="Nom du joueur..."
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-bright)',
            borderRadius: 8,
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setSingleGiveCount((c) => Math.max(1, c - 1))} disabled={singleGiveCount <= 1}
            style={{ width: 28, height: 34, borderRadius: 6, border: '1px solid var(--border-bright)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 16, cursor: singleGiveCount <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <input
            type="number"
            min={1}
            max={20}
            value={singleGiveCount}
            onChange={(e) => setSingleGiveCount(normalizeGiveCount(e.target.value))}
            style={{ width: 48, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 6, padding: '7px 4px', color: 'var(--neon-cyan)', fontSize: 15, fontWeight: 700, textAlign: 'center', outline: 'none' }}
          />
          <button onClick={() => setSingleGiveCount((c) => Math.min(20, c + 1))} disabled={singleGiveCount >= 20}
            style={{ width: 28, height: 34, borderRadius: 6, border: '1px solid var(--border-bright)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 16, cursor: singleGiveCount >= 20 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
        <button
          onClick={handleAddSingle}
          style={{
            background: 'rgba(6,182,212,0.2)',
            border: '1px solid var(--neon-cyan)',
            borderRadius: 8,
            color: 'var(--neon-cyan)',
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Spot list */}
      {paidSpots.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {paidSpots.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 12px',
              }}
            >
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>💰 {s.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => handleUpdateGiveCount(s.id, normalizeGiveCount(s.giveCount) - 1)}
                  style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border-bright)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>−</button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={s.giveCount ?? 1}
                  onChange={(e) => handleUpdateGiveCount(s.id, e.target.value)}
                  style={{ width: 44, background: 'var(--bg-secondary)', border: '1px solid var(--border-bright)', borderRadius: 4, padding: '3px 2px', color: 'var(--neon-cyan)', fontSize: 13, fontWeight: 700, textAlign: 'center', outline: 'none' }}
                />
                <button onClick={() => handleUpdateGiveCount(s.id, normalizeGiveCount(s.giveCount) + 1)}
                  style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border-bright)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
              </div>
              <button
                onClick={() => loadSessionSpots(
                  (allPaidSpots.length ? allPaidSpots : paidSpots).filter((spot) => spot.id !== s.id),
                  paidSpots.filter((spot) => spot.id !== s.id)
                )}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {paidSpots.length > 0 && (
        <button
          onClick={() => {
            if (!confirmClear) { setConfirmClear(true); return }
            setPaidSpots([])
            setConfirmClear(false)
          }}
          onBlur={() => setConfirmClear(false)}
          style={{
            background: confirmClear ? 'rgba(239,68,68,0.12)' : 'transparent',
            border: `1px solid ${confirmClear ? '#ef4444' : 'var(--border)'}`,
            borderRadius: 8,
            color: confirmClear ? '#ef4444' : 'var(--text-muted)',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: confirmClear ? 700 : 400,
          }}
        >
          {confirmClear ? '⚠️ Confirmer suppression' : 'Tout effacer'}
        </button>
      )}
    </div>
  )
}

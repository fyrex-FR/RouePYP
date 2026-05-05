import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useBreakStore } from '../../stores/breakStore'

export default function PaidSpotsInput() {
  const { paidSpots, setPaidSpots, addPaidSpot, removePaidSpot } = useBreakStore()
  const [bulk, setBulk] = useState('')
  const [singleName, setSingleName] = useState('')

  function handleBulkImport() {
    const names = bulk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (!names.length) return
    const existing = new Set(paidSpots.map((s) => s.name.toLowerCase()))
    const unique = names.filter((n) => !existing.has(n.toLowerCase()))
    const spots = unique.map((name) => ({ id: nanoid(), name }))
    setPaidSpots([...paidSpots, ...spots])
    setBulk('')
  }

  function handleAddSingle() {
    const name = singleName.trim()
    if (!name) return
    addPaidSpot(name)
    setSingleName('')
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
          Coller une liste (1 joueur par ligne)
        </label>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={'LeBron James\nSteph Curry\nKevin Durant'}
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
          placeholder="Ajouter un joueur..."
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
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>💰 {s.name}</span>
              <button
                onClick={() => removePaidSpot(s.id)}
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
          onClick={() => setPaidSpots([])}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Tout effacer
        </button>
      )}
    </div>
  )
}

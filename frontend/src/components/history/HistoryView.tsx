import { useState, useEffect } from 'react'
import { fetchDraws, fetchSessions } from '../../lib/supabase'
import type { Draw, Session } from '../../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function exportCSV(draws: Draw[]) {
  const rows: string[][] = [['Spot payant', 'Acheteur', 'Joueur give', 'Heure']]
  for (const draw of draws) {
    for (const r of draw.results) {
      rows.push([
        draw.spot_name,
        r.buyer_name ?? '',
        r.give_player,
        new Date(r.drawn_at).toLocaleString('fr-FR'),
      ])
    }
  }
  const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tirages_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function HistoryView() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all')
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSessions().then(setSessions)
  }, [])

  useEffect(() => {
    // The loading flag intentionally flips as soon as the selected session changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const sessionId = selectedSessionId === 'all' ? undefined : selectedSessionId
    fetchDraws(sessionId).then((d) => {
      setDraws(d)
      setLoading(false)
    })
  }, [selectedSessionId])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              📋 Historique des tirages
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Tous les tirages enregistrés, du plus récent au plus ancien.
            </p>
          </div>
          {draws.length > 0 && (
            <button
              onClick={() => exportCSV(draws)}
              style={{
                flexShrink: 0,
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid var(--neon-green)',
                borderRadius: 12,
                color: 'var(--neon-green)',
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ⬇️ Exporter CSV
            </button>
          )}
        </div>

        {/* Session selector */}
        {sessions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>
              Break :
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-bright)',
                borderRadius: 8,
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tous les breaks</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.break_name} — {formatDate(s.created_at)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
          Chargement…
        </div>
      )}

      {!loading && draws.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: 48,
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎡</div>
          <p>Aucun tirage pour l'instant.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Lance un premier tirage depuis la vue Roue !</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {draws.map((draw) => {
          const isOpen = expanded.has(draw.id)
          return (
            <div
              key={draw.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => toggleExpand(draw.id)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 20 }}>🎰</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {draw.spot_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(draw.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      background: 'rgba(168,85,247,0.15)',
                      border: '1px solid var(--accent)',
                      borderRadius: 20,
                      padding: '2px 10px',
                      fontSize: 13,
                      color: 'var(--accent-bright)',
                    }}
                  >
                    {draw.results.length} tirage{draw.results.length > 1 ? 's' : ''}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {draw.results.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: 'var(--bg-secondary)',
                        borderRadius: 10,
                        padding: '10px 14px',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 20 }}>
                        #{i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--neon-green)', fontWeight: 600 }}>
                        🎁 {r.give_player}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--neon-cyan)', fontWeight: 600 }}>
                        💰 {r.paid_player}{r.buyer_name ? ` · 👤 ${r.buyer_name}` : ''}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(r.drawn_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

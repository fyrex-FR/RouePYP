import { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { useBreakStore } from '../../stores/breakStore'
import { saveSession, updateSession, fetchSessions, deleteSession, deleteDrawsBySession, fetchDraws } from '../../lib/supabase'
import type { Session } from '../../types'
import GivePlayersInput from './GivePlayersInput'
import PaidSpotsInput from './PaidSpotsInput'

export default function AdminPanel() {
  const {
    breakName, setBreakName,
    givePlayers, paidSpots, allPaidSpots,
    reservedGives, setReservedGives,
    setSessionId, sessionId,
    resetDrawn, resetTirage, setGivePlayers, setPaidSpots, loadSessionSpots, setDrawnPlayers,
  } = useBreakStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmResetDraw, setConfirmResetDraw] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    fetchSessions().then(setSessions)
  }, [])

  async function handleDeleteSession() {
    if (!sessionId) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    const ok = await deleteSession(sessionId)
    if (ok) {
      setBreakName('')
      setGivePlayers([])
      setPaidSpots([])
      setReservedGives([])
      setSessionId(null)
      resetDrawn()
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    }
    setConfirmDelete(false)
  }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return }
    setBreakName('')
    setGivePlayers([])
    setPaidSpots([])
    setReservedGives([])
    setSessionId(null)
    resetDrawn()
    setConfirmReset(false)
  }

  async function handleLoadSession(id: string) {
    if (id === '__new__') {
      setBreakName('')
      setGivePlayers([])
      setPaidSpots([])
      setReservedGives([])
      setSessionId(null)
      resetDrawn()
      return
    }
    const session = sessions.find((s) => s.id === id)
    if (!session) return

    // Récupérer les draws existants pour restaurer l'état
    const draws = await fetchDraws(session.id)
    const drawnNames = draws.flatMap((d) =>
      (d.results as { give_player: string }[]).map((r) => r.give_player)
    )
    const drawnSpotNames = new Set(draws.map((d) => d.spot_name))

    const allSessionSpots = session.paid_spots.map((s) => ({ id: nanoid(), name: s.name, giveCount: s.giveCount ?? 1 }))
    const remainingSessionSpots = allSessionSpots.filter((s) => !drawnSpotNames.has(s.name))
    const loadedGivePlayers = session.give_players.map((name) => ({ id: nanoid(), name }))
    const loadedReservedGives = session.paid_spots.flatMap((spot) => {
      const loadedSpot = allSessionSpots.find((s) => s.name === spot.name)
      return (spot.reservedGives ?? []).map((giveName) => {
        const givePlayer = loadedGivePlayers.find((p) => p.name === giveName)
        if (!loadedSpot || !givePlayer) return null
        return { id: nanoid(), givePlayerId: givePlayer.id, givePlayerName: givePlayer.name, spotId: loadedSpot.id, spotName: loadedSpot.name }
      }).filter(Boolean)
    })

    setBreakName(session.break_name)
    setGivePlayers(loadedGivePlayers)
    loadSessionSpots(allSessionSpots, remainingSessionSpots)
    setReservedGives(loadedReservedGives as NonNullable<(typeof loadedReservedGives)[number]>[])
    setSessionId(session.id)
    setDrawnPlayers(drawnNames)
  }

  async function handleSave() {
    if (!breakName.trim() || !givePlayers.length || !paidSpots.length) return
    setSaving(true)

    const payload = {
      break_name: breakName.trim(),
      give_players: givePlayers.map((p) => p.name),
      // Persist all known spots, not only remaining ones, so a live edit does not
      // erase already-drawn spots from the saved session definition.
      paid_spots: (allPaidSpots.length ? allPaidSpots : paidSpots).map((s) => ({
        name: s.name,
        giveCount: s.giveCount,
        reservedGives: reservedGives
          .filter((r) => r.spotId === s.id || r.spotName === s.name)
          .map((r) => r.givePlayerName),
      })),
    }

    const session = sessionId
      ? await updateSession(sessionId, payload)
      : await saveSession(payload)

    if (session) {
      setSessionId(session.id)
      setSaved(true)
      fetchSessions().then(setSessions)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const canSave = breakName.trim() && givePlayers.length > 0 && paidSpots.length > 0

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          ⚙️ Panneau Admin
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Configure les joueurs et les spots avant de lancer les tirages.
        </p>
      </div>

      {/* Session selector + break name */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {sessions.length > 0 && (
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Charger un break existant
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={sessionId ?? '__new__'}
                onChange={(e) => { handleLoadSession(e.target.value); setConfirmDelete(false) }}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="__new__">✨ Nouveau break</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.break_name}
                  </option>
                ))}
              </select>
              {sessionId && (
                <button
                  onClick={handleDeleteSession}
                  onBlur={() => setConfirmDelete(false)}
                  title="Supprimer ce break"
                  style={{
                    flexShrink: 0,
                    background: confirmDelete ? 'rgba(239,68,68,0.15)' : 'transparent',
                    border: `1px solid ${confirmDelete ? '#ef4444' : 'var(--border-bright)'}`,
                    borderRadius: 8,
                    color: confirmDelete ? '#ef4444' : 'var(--text-muted)',
                    padding: '0 14px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: confirmDelete ? 700 : 400,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {confirmDelete ? '⚠️ Confirmer' : '🗑️ Supprimer'}
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Nom du break
          </label>
          <input
            value={breakName}
            onChange={(e) => setBreakName(e.target.value)}
            placeholder="Ex: Break Pick Your Player — 10 mai 2026"
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-bright)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: 16,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <GivePlayersInput />
        </div>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <PaidSpotsInput />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            background: canSave && !saving ? 'linear-gradient(135deg, var(--accent), var(--neon-cyan))' : 'var(--bg-card)',
            border: 'none',
            borderRadius: 12,
            color: canSave && !saving ? '#fff' : 'var(--text-muted)',
            padding: '14px 32px',
            cursor: canSave && !saving ? 'pointer' : 'not-allowed',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.5,
            transition: 'all 0.2s',
            boxShadow: canSave && !saving ? '0 4px 20px var(--accent-glow)' : 'none',
          }}
        >
          {saving ? '⏳ Sauvegarde...' : sessionId ? '💾 Mettre à jour la session' : '💾 Sauvegarder la session'}
        </button>

        {saved && (
          <span style={{ color: 'var(--neon-green)', fontSize: 14, fontWeight: 600, animation: 'slide-up 0.3s ease' }}>
            ✓ Session {sessionId ? 'mise à jour' : 'sauvegardée'} !
          </span>
        )}

        {sessionId && !saved && (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Session active : <code style={{ color: 'var(--accent-bright)' }}>{sessionId.slice(0, 8)}…</code>
          </span>
        )}

        <button
          onClick={async () => {
            if (!confirmResetDraw) { setConfirmResetDraw(true); return }
            if (sessionId) await deleteDrawsBySession(sessionId)
            resetTirage()
            setConfirmResetDraw(false)
          }}
          onBlur={() => setConfirmResetDraw(false)}
          disabled={paidSpots.length === allPaidSpots.length}
          title="Remet tous les spots et efface les tirages en cours"
          style={{
            background: 'transparent',
            border: '1px solid var(--neon-cyan)',
            borderRadius: 12,
            color: confirmResetDraw ? '#ef4444' : paidSpots.length === allPaidSpots.length ? 'var(--text-muted)' : 'var(--neon-cyan)',
            borderColor: confirmResetDraw ? '#ef4444' : paidSpots.length === allPaidSpots.length ? 'var(--border-bright)' : 'var(--neon-cyan)',
            padding: '14px 20px',
            cursor: paidSpots.length === allPaidSpots.length ? 'not-allowed' : 'pointer',
            fontSize: 14,
            transition: 'all 0.2s',
          }}
        >
          {confirmResetDraw ? '⚠️ Confirmer reset tirage' : '🔄 Reset tirage'}
        </button>

        <button
          onClick={handleReset}
          onBlur={() => setConfirmReset(false)}
          style={{
            marginLeft: 'auto',
            background: confirmReset ? 'rgba(239,68,68,0.15)' : 'transparent',
            border: `1px solid ${confirmReset ? '#ef4444' : 'var(--border-bright)'}`,
            borderRadius: 12,
            color: confirmReset ? '#ef4444' : 'var(--text-muted)',
            padding: '14px 20px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: confirmReset ? 700 : 400,
            transition: 'all 0.2s',
          }}
        >
          {confirmReset ? '⚠️ Confirmer le reset' : '🗑️ Reset break'}
        </button>
      </div>
    </div>
  )
}

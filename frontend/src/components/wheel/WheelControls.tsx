import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBreakStore } from '../../stores/breakStore'
import { deleteDraw, fetchLatestDraw, saveDraw } from '../../lib/supabase'
import GiveawayDisplay from './GiveawayDisplay'
import type { GiveawayDisplayMode } from './GiveawayDisplay'
import ResultOverlay from './ResultOverlay'
import StreamView from './StreamView'
import type { DrawResult } from '../../types'

function normalizeDrawCount(value: number | null | undefined, maxDraws: number) {
  if (maxDraws < 1) return 0
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.min(Math.floor(parsed), maxDraws)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function copyToClipboard(results: DrawResult[], spotName?: string) {
  const lines = results.map((r) => `🎁 ${r.give_player} → 💰 ${r.paid_player}${r.buyer_name ? ` (${r.buyer_name})` : ''}`)
  const text = spotName
    ? `Résultats — ${spotName}\n${lines.join('\n')}`
    : lines.join('\n')
  navigator.clipboard.writeText(text)
}

export default function WheelControls() {
  const {
    givePlayers, paidSpots, drawnPlayers,
    reservedGives,
    markDrawn, unmarkDrawn,
    sessionId, removePaidSpot, restorePaidSpot,
    addLiveResults, removeLiveResultsForSpot,
  } = useBreakStore()

  const availablePlayers = useMemo(
    () => {
      const reservedIds = new Set(reservedGives.map((r) => r.givePlayerId))
      return givePlayers.filter((p) => !drawnPlayers.includes(p.name) && !reservedIds.has(p.id))
    },
    [givePlayers, drawnPlayers, reservedGives]
  )

  const [selectedSpotId, setSelectedSpotId] = useState<string>('')
  const [drawCount, setDrawCount] = useState(1)
  const [spinning, setSpinning] = useState(false)
  const [triggerSpin, setTriggerSpin] = useState(false)
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0)
  const [sessionResults, setSessionResults] = useState<DrawResult[]>([])
  const [savedPartialResults, setSavedPartialResults] = useState<DrawResult[]>([])
  const [winner, setWinner] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [remainingSegments, setRemainingSegments] = useState<string[]>([])

  // Quick draw
  const [quickResults, setQuickResults] = useState<DrawResult[]>([])
  const [showQuickRecap, setShowQuickRecap] = useState(false)

  // Copié feedback
  const [copied, setCopied] = useState(false)

  // Undo / safety
  const [undoing, setUndoing] = useState(false)
  const [undoMessage, setUndoMessage] = useState<string | null>(null)
  const [drawWarning, setDrawWarning] = useState<string | null>(null)

  // Stream mode
  const [streamMode, setStreamMode] = useState(false)
  const [displayMode, setDisplayMode] = useState<GiveawayDisplayMode>('auto')
  const [buyerNameBySpot, setBuyerNameBySpot] = useState<Record<string, string>>({})

  const sortedSpots = useMemo(
    () => [...paidSpots].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [paidSpots]
  )
  const effectiveSelectedSpotId = selectedSpotId || sortedSpots[0]?.id || ''
  const selectedSpot = paidSpots.find((s) => s.id === effectiveSelectedSpotId)
  const selectedSpotReservedCount = selectedSpot
    ? reservedGives.filter((r) => r.spotId === selectedSpot.id || r.spotName === selectedSpot.name).length
    : 0
  const selectedSpotRemainingGiveCount = selectedSpot
    ? Math.max(0, (selectedSpot.giveCount ?? 1) - selectedSpotReservedCount)
    : 0
  const maxDraws = Math.min(availablePlayers.length, selectedSpotRemainingGiveCount, 20)
  const effectiveDrawCount = normalizeDrawCount(drawCount, maxDraws)
  const currentBuyerName = selectedSpot ? buyerNameBySpot[selectedSpot.id]?.trim() || '' : ''

  function askBuyerName(spotName: string, previous = '') {
    return window.prompt(`Qui a pris/rentré le spot ${spotName} ?`, previous)?.trim() ?? ''
  }

  // Prédéfinir le drawCount quand on change de spot
  useEffect(() => {
    if (selectedSpot) {
      queueMicrotask(() => setDrawCount(normalizeDrawCount(selectedSpot.giveCount, maxDraws)))
    }
  }, [effectiveSelectedSpotId, selectedSpot, maxDraws])

  useEffect(() => {
    if (!spinning && !showOverlay) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [spinning, showOverlay])

  const startSequence = useCallback(() => {
    if (!selectedSpot || availablePlayers.length === 0 || selectedSpotRemainingGiveCount <= 0 || spinning) return
    const buyerName = currentBuyerName || askBuyerName(selectedSpot.name)
    if (!buyerName) return
    setBuyerNameBySpot((prev) => ({ ...prev, [selectedSpot.id]: buyerName }))
    setCurrentDrawIndex(0)
    setSessionResults([])
    setSavedPartialResults([])
    setRemainingSegments(availablePlayers.map((p) => p.name))
    setTriggerSpin(true)
    setSpinning(true)
  }, [selectedSpot, availablePlayers, selectedSpotRemainingGiveCount, spinning, currentBuyerName])

  async function quickDraw() {
    if (!selectedSpot || availablePlayers.length === 0 || selectedSpotRemainingGiveCount <= 0 || spinning) return
    const buyerName = currentBuyerName || askBuyerName(selectedSpot.name)
    if (!buyerName) return
    setBuyerNameBySpot((prev) => ({ ...prev, [selectedSpot.id]: buyerName }))
    setDrawWarning(null)
    const picked = shuffle(availablePlayers).slice(0, effectiveDrawCount)
    const now = new Date().toISOString()
    const results: DrawResult[] = picked.map((p) => ({
      give_player: p.name,
      paid_player: selectedSpot.name,
      buyer_name: buyerName,
      drawn_at: now,
    }))
    picked.forEach((p) => markDrawn(p.name))
    addLiveResults(results.map((r) => ({ ...r, spot: selectedSpot.name })))
    setQuickResults(results)
    setShowQuickRecap(true)
    const saved = await saveDraw({ session_id: sessionId, spot_name: selectedSpot.name, draw_count: results.length, results })
    if (!saved && sessionId) {
      setDrawWarning('⚠️ Tirage gardé en local, mais sauvegarde cloud échouée. Ne recharge pas la page avant d’avoir copié le résultat.')
    }
    removePaidSpot(selectedSpot.id)
    setSelectedSpotId('')
  }

  async function undoLastDraw() {
    if (!sessionId || undoing || spinning) return
    setUndoing(true)
    setUndoMessage(null)

    const latestDraw = await fetchLatestDraw(sessionId)
    if (!latestDraw) {
      setUndoMessage('Aucun tirage à annuler')
      setUndoing(false)
      return
    }

    const deleted = await deleteDraw(latestDraw.id)
    if (!deleted) {
      setUndoMessage('Annulation impossible')
      setUndoing(false)
      return
    }

    const playerNames = latestDraw.results.map((r) => r.give_player)
    unmarkDrawn(playerNames)
    restorePaidSpot(latestDraw.spot_name)
    removeLiveResultsForSpot(latestDraw.spot_name)
    setSelectedSpotId('')
    setUndoMessage(`Dernier tirage annulé : ${latestDraw.spot_name}`)
    setTimeout(() => setUndoMessage(null), 3000)
    setUndoing(false)
  }

  function handleResult(w: string) {
    setWinner(w)
    setShowOverlay(true)
  }

  function handleSpinComplete() {
    setTriggerSpin(false)
  }

  const handleClose = useCallback(async (results?: DrawResult[]) => {
    const finalResults = results ?? sessionResults
    const unsavedResults = finalResults.filter((r) => !savedPartialResults.some((s) => s.give_player === r.give_player && s.paid_player === r.paid_player && s.drawn_at === r.drawn_at))
    setDrawWarning(null)
    setShowOverlay(false)
    setSpinning(false)
    setWinner(null)
    setRemainingSegments([])
    if (selectedSpot && finalResults.length > 0) {
      addLiveResults(finalResults.map((r) => ({ ...r, spot: selectedSpot.name })))
      const saved = unsavedResults.length > 0
        ? await saveDraw({ session_id: sessionId, spot_name: selectedSpot.name, draw_count: unsavedResults.length, results: unsavedResults })
        : true
      if (!saved && sessionId) {
        setDrawWarning('⚠️ Tirage gardé en local, mais sauvegarde cloud échouée. Ne recharge pas la page avant d’avoir copié le résultat.')
      }
      removePaidSpot(selectedSpot.id)
      setSelectedSpotId('')
    }
  }, [sessionResults, savedPartialResults, selectedSpot, addLiveResults, sessionId, removePaidSpot])

  const handleNext = useCallback(async () => {
    if (!winner || !selectedSpot) return
    const result: DrawResult = {
      give_player: winner,
      paid_player: selectedSpot.name,
      buyer_name: currentBuyerName || buyerNameBySpot[selectedSpot.id] || '',
      drawn_at: new Date().toISOString(),
    }
    const updatedResults = [...sessionResults, result]
    setSessionResults(updatedResults)
    markDrawn(winner)
    const saved = await saveDraw({ session_id: sessionId, spot_name: selectedSpot.name, draw_count: 1, results: [result] })
    if (saved || !sessionId) {
      setSavedPartialResults((prev) => [...prev, result])
    } else {
      setDrawWarning('⚠️ Ce give est validé localement, mais sauvegarde cloud échouée. Ne recharge pas la page avant d’avoir copié le résultat.')
    }
    const nextIndex = currentDrawIndex + 1
    if (nextIndex < effectiveDrawCount) {
      const newRemaining = remainingSegments.filter((n) => n !== winner)
      setRemainingSegments(newRemaining)
      setCurrentDrawIndex(nextIndex)
      setShowOverlay(false)
      setWinner(null)
      setTimeout(() => setTriggerSpin(true), 400)
    } else {
      handleClose(updatedResults)
    }
  }, [winner, selectedSpot, sessionResults, markDrawn, sessionId, currentDrawIndex, effectiveDrawCount, remainingSegments, handleClose, currentBuyerName, buyerNameBySpot])

  // Raccourcis clavier
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
    if (e.code === 'Space') {
      e.preventDefault()
      if (!spinning && selectedSpot && availablePlayers.length > 0) startSequence()
    }
    if (e.code === 'Enter') {
      e.preventDefault()
      if (showOverlay) handleNext()
    }
  }, [spinning, selectedSpot, availablePlayers.length, showOverlay, startSequence, handleNext])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handleCopy(results: DrawResult[], spotName?: string) {
    copyToClipboard(results, spotName)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasNoPlayers = availablePlayers.length === 0
  const hasNoSpots = paidSpots.length === 0
  const canAct = !spinning && !!selectedSpot && !hasNoPlayers && selectedSpotRemainingGiveCount > 0

  if (streamMode) {
    return (
      <StreamView
        segments={remainingSegments.length ? remainingSegments : availablePlayers.map((p) => p.name)}
        selectedSpotId={effectiveSelectedSpotId}
        selectedSpot={selectedSpot?.name ?? ''}
        paidSpots={paidSpots}
        drawCount={effectiveDrawCount}
        maxDraws={maxDraws}
        spinning={spinning}
        winner={winner}
        onExit={() => setStreamMode(false)}
        triggerSpin={triggerSpin}
        onResult={handleResult}
        onSpinComplete={handleSpinComplete}
        onSpotChange={setSelectedSpotId}
        onDrawCountChange={setDrawCount}
        onStart={startSequence}
        onQuickDraw={quickDraw}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />
    )
  }

  return (
    <div className="wheel-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '32px 24px', minHeight: 'calc(100vh - 64px)' }}>
      {/* Title + stream toggle */}
      <div className="wheel-header" style={{ textAlign: 'center', position: 'relative', width: '100%', maxWidth: 900 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, var(--accent-bright), var(--neon-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6 }}>
          🎡 Tirage au sort
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Pick Your Player — Give Edition</p>
        <button
          onClick={() => setStreamMode(true)}
          title="Mode stream plein écran"
          className="stream-toggle"
          style={{ position: 'absolute', right: 0, top: 0, background: 'rgba(168,85,247,0.15)', border: '1px solid var(--accent)', borderRadius: 10, color: 'var(--accent-bright)', padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          📺 Stream
        </button>
      </div>

      {hasNoSpots && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--neon-yellow)', borderRadius: 12, padding: '12px 20px', color: 'var(--neon-yellow)', fontSize: 14 }}>
          ⚠️ Aucun spot configuré.{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Va dans Admin pour ajouter des spots.</span>
        </div>
      )}
      {hasNoPlayers && !hasNoSpots && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--neon-yellow)', borderRadius: 12, padding: '12px 20px', color: 'var(--neon-yellow)', fontSize: 14 }}>
          ⚠️ Tous les joueurs give ont déjà été tirés.
        </div>
      )}
      {!sessionId && !hasNoSpots && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--neon-yellow)', borderRadius: 12, padding: '12px 20px', color: 'var(--neon-yellow)', fontSize: 14, maxWidth: 760, textAlign: 'center' }}>
          ⚠️ Session non sauvegardée : le navigateur garde l’état en local, mais sauvegarde le break dans Admin avant le live pour pouvoir restaurer depuis l’historique.
        </div>
      )}
      {drawWarning && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: 12, padding: '12px 20px', color: '#ef4444', fontSize: 14, maxWidth: 760, textAlign: 'center' }}>
          {drawWarning}
        </div>
      )}

      <div className="wheel-layout" style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 1100 }}>
        {/* Wheel / Big Giveaway */}
        <GiveawayDisplay
          segments={remainingSegments.length ? remainingSegments : availablePlayers.map((p) => p.name)}
          onResult={handleResult}
          triggerSpin={triggerSpin}
          onSpinComplete={handleSpinComplete}
          mode={displayMode}
        />

        {/* Controls */}
        <div className="wheel-controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 260, flex: '1 1 260px', maxWidth: 320 }}>
          {/* Spot selector */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
              Spot sélectionné
            </label>
            {hasNoSpots ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>— aucun —</div>
            ) : (
              <select
                value={effectiveSelectedSpotId}
                onChange={(e) => setSelectedSpotId(e.target.value)}
                disabled={spinning}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer' }}
              >
                {sortedSpots.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{buyerNameBySpot[s.id] ? ` — ${buyerNameBySpot[s.id]}` : ''}</option>
                ))}
              </select>
            )}
            {/* Gives restants pour ce spot */}
            {selectedSpot && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Gives restants</span>
                <span style={{ color: availablePlayers.length === 0 ? '#ef4444' : 'var(--neon-green)', fontWeight: 700 }}>
                  {selectedSpotRemainingGiveCount} pour ce spot · {availablePlayers.length} en roue
                </span>
              </div>
            )}
            {selectedSpot && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    const buyerName = askBuyerName(selectedSpot.name, currentBuyerName)
                    if (buyerName) setBuyerNameBySpot((prev) => ({ ...prev, [selectedSpot.id]: buyerName }))
                  }}
                  disabled={spinning}
                  style={{ flex: 1, background: currentBuyerName ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${currentBuyerName ? 'var(--neon-green)' : 'var(--neon-yellow)'}`, borderRadius: 8, color: currentBuyerName ? 'var(--neon-green)' : 'var(--neon-yellow)', padding: '7px 9px', cursor: spinning ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}
                >
                  {currentBuyerName ? `👤 ${currentBuyerName}` : '👤 Renseigner acheteur'}
                </button>
              </div>
            )}
            {selectedSpot && selectedSpotReservedCount > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--neon-cyan)' }}>
                🔒 {selectedSpotReservedCount} give réservé{selectedSpotReservedCount > 1 ? 's' : ''} consomme{selectedSpotReservedCount > 1 ? 'nt' : ''} déjà {selectedSpotReservedCount} droit{selectedSpotReservedCount > 1 ? 's' : ''}.
              </div>
            )}
          </div>

          {/* Display mode */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
              Affichage
            </label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as GiveawayDisplayMode)}
              disabled={spinning}
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="auto">Auto recommandé</option>
              <option value="wheel">Forcer roue</option>
              <option value="big">Forcer Big Give</option>
            </select>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Auto bascule en Big Give à partir de 201 joueurs.
            </div>
          </div>

          {/* Draw count */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
              Nombre de tirages
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setDrawCount((c) => Math.max(1, c - 1))} disabled={effectiveDrawCount <= 1 || spinning}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-bright)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 20, cursor: effectiveDrawCount <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-bright)', minWidth: 48, textAlign: 'center' }}>{effectiveDrawCount}</span>
              <button onClick={() => setDrawCount((c) => Math.min(maxDraws, c + 1))} disabled={effectiveDrawCount >= maxDraws || spinning}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-bright)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 20, cursor: effectiveDrawCount >= maxDraws ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          {/* Buttons */}
          <button onClick={startSequence} disabled={!canAct}
            style={{ background: canAct ? 'linear-gradient(135deg, var(--accent), #7c3aed)' : 'var(--bg-card)', border: 'none', borderRadius: 14, color: canAct ? '#fff' : 'var(--text-muted)', padding: '16px 20px', cursor: canAct ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 800, boxShadow: canAct ? '0 6px 30px var(--accent-glow)' : 'none', transition: 'all 0.2s', animation: canAct ? 'pulse-glow 2s ease-in-out infinite' : 'none' }}>
            {spinning ? '🌀 En cours...' : '🚀 LANCER  [Espace]'}
          </button>

          <button onClick={quickDraw} disabled={!canAct}
            style={{ background: canAct ? 'rgba(245,158,11,0.15)' : 'transparent', border: `1px solid ${canAct ? 'var(--neon-yellow)' : 'var(--border)'}`, borderRadius: 14, color: canAct ? 'var(--neon-yellow)' : 'var(--text-muted)', padding: '11px 20px', cursor: canAct ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}>
            ⚡ Tirage rapide — récap direct
          </button>

          <button onClick={undoLastDraw} disabled={!sessionId || undoing || spinning}
            title={sessionId ? 'Annule le dernier tirage sauvegardé' : 'Sauvegarde une session pour activer l’annulation'}
            style={{ background: sessionId && !spinning ? 'rgba(239,68,68,0.12)' : 'transparent', border: `1px solid ${sessionId && !spinning ? '#ef4444' : 'var(--border)'}`, borderRadius: 14, color: sessionId && !spinning ? '#ef4444' : 'var(--text-muted)', padding: '11px 20px', cursor: sessionId && !spinning ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}>
            {undoing ? '⏳ Annulation...' : '↩️ Annuler dernier tirage'}
          </button>

          {undoMessage && (
            <div style={{ fontSize: 12, color: undoMessage.includes('annulé') ? 'var(--neon-green)' : 'var(--neon-yellow)', textAlign: 'center' }}>
              {undoMessage}
            </div>
          )}

          {/* Keyboard hint */}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 4, padding: '1px 5px' }}>Espace</kbd> Lancer &nbsp;·&nbsp;
            <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 4, padding: '1px 5px' }}>Entrée</kbd> Suivant
          </div>

          {/* Drawn players */}
          {drawnPlayers.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Déjà tirés ({drawnPlayers.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {Array.from({ length: Math.ceil(drawnPlayers.length / 5) }, (_, row) => (
                  <div key={row} style={{ display: 'flex', gap: 5 }}>
                    {drawnPlayers.slice(row * 5, row * 5 + 5).map((p) => (
                      <span key={p} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--neon-green)', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: 'var(--neon-green)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{p}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Animated overlay */}
      {showOverlay && winner && selectedSpot && (
        <ResultOverlay winner={winner} spotName={selectedSpot.name} drawIndex={currentDrawIndex} totalDraws={effectiveDrawCount} onNext={handleNext} onClose={() => handleClose()} />
      )}

      {/* Quick draw recap */}
      {showQuickRecap && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={() => setShowQuickRecap(false)}>
          <div className="quick-recap-card" style={{ background: 'var(--bg-card)', border: '2px solid var(--neon-yellow)', borderRadius: 24, padding: '40px 48px', maxWidth: 460, width: '90%', boxShadow: '0 0 60px rgba(245,158,11,0.3)', animation: 'bounce-in 0.4s cubic-bezier(0.36,0.07,0.19,0.97)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚡</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 4 }}>Tirage rapide</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24 }}>
              {quickResults[0]?.paid_player} — {quickResults.length} give{quickResults.length > 1 ? 's' : ''} attribué{quickResults.length > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {quickResults.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 14px' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 20 }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--neon-green)' }}>🎁 {r.give_player}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--neon-cyan)' }}>💰 {r.paid_player}{r.buyer_name ? ` · 👤 ${r.buyer_name}` : ''}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleCopy(quickResults, quickResults[0]?.paid_player)}
                style={{ flex: 1, background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(168,85,247,0.15)', border: `1px solid ${copied ? 'var(--neon-green)' : 'var(--accent)'}`, borderRadius: 12, color: copied ? 'var(--neon-green)' : 'var(--accent-bright)', padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}
              >
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>
              <button onClick={() => setShowQuickRecap(false)} style={{ flex: 1, background: 'linear-gradient(135deg, var(--neon-yellow), var(--neon-orange))', border: 'none', borderRadius: 12, color: '#000', padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>
                Fermer ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

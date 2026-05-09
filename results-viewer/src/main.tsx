import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './index.css'

type DrawResult = {
  give_player: string
  paid_player: string
  buyer_name?: string
  drawn_at: string
}

type Draw = {
  id: string
  session_id: string
  created_at: string
  spot_name: string
  draw_count: number
  results: DrawResult[]
}

type Session = {
  id: string
  created_at: string
  break_name: string
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

function getSessionId() {
  const params = new URLSearchParams(window.location.search)
  return params.get('session') || params.get('history') || ''
}

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
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resultats_break_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function App() {
  const sessionId = getSessionId()
  const [session, setSession] = useState<Session | null>(null)
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!supabase) {
      setError('Configuration Supabase manquante.')
      setLoading(false)
      return
    }
    if (!sessionId) {
      setError('Lien de résultats incomplet : session manquante.')
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const [{ data: sessionData, error: sessionError }, { data: drawsData, error: drawsError }] = await Promise.all([
        supabase!.from('sessions').select('id, created_at, break_name').eq('id', sessionId).maybeSingle(),
        supabase!.from('draws').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      if (sessionError || drawsError) {
        setError('Impossible de charger les résultats pour le moment.')
        setLoading(false)
        return
      }
      setSession(sessionData as Session | null)
      setDraws((drawsData ?? []) as Draw[])
      setExpanded(new Set(((drawsData ?? []) as Draw[]).slice(0, 1).map((d) => d.id)))
      setLoading(false)
    }
    load()
    const timer = window.setInterval(load, 15000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [sessionId])

  const totalResults = useMemo(() => draws.reduce((sum, draw) => sum + draw.results.length, 0), [draws])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(168,85,247,0.16), transparent 36%), var(--bg-primary)' }}>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 18px 56px' }}>
        <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--accent-bright)', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Rouuuuue · Pick Your Player
            </div>
            <h1 className="text-glow-purple" style={{ fontSize: 'clamp(30px, 7vw, 52px)', lineHeight: 1, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>
              🎁 Résultats du break
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              {session?.break_name ?? 'Résultats publics en lecture seule'}
            </p>
          </div>
          {draws.length > 0 && (
            <button
              onClick={() => exportCSV(draws)}
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid var(--neon-green)',
                borderRadius: 14,
                color: 'var(--neon-green)',
                padding: '11px 18px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              ⬇️ Export CSV
            </button>
          )}
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
          <div style={metricStyle}><strong>{draws.length}</strong><span>spots tirés</span></div>
          <div style={metricStyle}><strong>{totalResults}</strong><span>gives attribués</span></div>
          <div style={metricStyle}><strong>{session ? formatDate(session.created_at).slice(0, 10) : '—'}</strong><span>break</span></div>
        </section>

        {loading && <Empty icon="⏳" title="Chargement…" text="Les résultats arrivent." />}
        {!loading && error && <Empty icon="⚠️" title="Lien indisponible" text={error} />}
        {!loading && !error && draws.length === 0 && <Empty icon="🎡" title="Aucun tirage pour l’instant" text="La page se met à jour automatiquement pendant le live." />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {draws.map((draw) => {
            const isOpen = expanded.has(draw.id)
            return (
              <article key={draw.id} style={{ background: 'rgba(26,26,38,0.92)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 18px 50px rgba(0,0,0,0.22)' }}>
                <button onClick={() => toggleExpand(draw.id)} style={{ width: '100%', background: 'transparent', border: 0, padding: '17px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <span style={{ fontSize: 24 }}>🎰</span>
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draw.spot_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(draw.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid var(--accent)', borderRadius: 999, padding: '3px 10px', fontSize: 13, color: 'var(--accent-bright)', whiteSpace: 'nowrap' }}>
                      {draw.results.length} tirage{draw.results.length > 1 ? 's' : ''}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {draw.results.map((r, i) => (
                      <div key={`${draw.id}-${i}`} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto 1fr auto', alignItems: 'center', gap: 10, background: 'var(--bg-secondary)', borderRadius: 12, padding: '11px 13px' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{i + 1}</span>
                        <span style={{ color: 'var(--neon-green)', fontWeight: 800 }}>🎁 {r.give_player}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span style={{ color: 'var(--neon-cyan)', fontWeight: 800 }}>💰 {r.paid_player}{r.buyer_name ? ` · 👤 ${r.buyer_name}` : ''}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.drawn_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}

const metricStyle: React.CSSProperties = {
  background: 'rgba(26,26,38,0.75)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  color: 'var(--text-secondary)',
}

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48, background: 'rgba(26,26,38,0.8)', borderRadius: 18, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 13 }}>{text}</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

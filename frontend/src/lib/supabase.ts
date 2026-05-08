import { createClient } from '@supabase/supabase-js'
import type { Draw, Session } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function saveSession(data: {
  break_name: string
  give_players: string[]
  paid_spots: { name: string; giveCount?: number }[]
}): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .insert(data)
    .select()
    .single()
  if (error) { console.error('saveSession:', error); return null }
  return session
}

export async function updateSession(id: string, data: {
  break_name: string
  give_players: string[]
  paid_spots: { name: string; giveCount?: number }[]
}): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('updateSession:', error); return null }
  return session
}

export async function saveDraw(data: {
  session_id: string | null
  spot_name: string
  draw_count: number
  results: { give_player: string; paid_player: string; drawn_at: string }[]
}): Promise<Draw | null> {
  const { data: draw, error } = await supabase
    .from('draws')
    .insert(data)
    .select()
    .single()
  if (error) { console.error('saveDraw:', error); return null }
  return draw
}

export async function deleteSession(id: string): Promise<boolean> {
  await supabase.from('draws').delete().eq('session_id', id)
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) { console.error('deleteSession:', error); return false }
  return true
}

export async function deleteDrawsBySession(sessionId: string): Promise<void> {
  await supabase.from('draws').delete().eq('session_id', sessionId)
}

export async function deleteDraw(id: string): Promise<boolean> {
  const { error } = await supabase.from('draws').delete().eq('id', id)
  if (error) { console.error('deleteDraw:', error); return false }
  return true
}

export async function fetchLatestDraw(sessionId: string): Promise<Draw | null> {
  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) { console.error('fetchLatestDraw:', error); return null }
  return data
}

export async function fetchSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchSessions:', error); return [] }
  return data ?? []
}

export async function fetchDraws(sessionId?: string): Promise<Draw[]> {
  let query = supabase
    .from('draws')
    .select('*')
    .order('created_at', { ascending: false })
  if (sessionId) query = query.eq('session_id', sessionId)
  const { data, error } = await query
  if (error) { console.error('fetchDraws:', error); return [] }
  return data ?? []
}

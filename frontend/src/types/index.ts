export interface PaidSpot {
  id: string
  name: string
  giveCount: number
}

export interface ReservedGive {
  id: string
  givePlayerId: string
  givePlayerName: string
  spotId: string
  spotName: string
}

export interface GivePlayer {
  id: string
  name: string
}

export interface DrawResult {
  give_player: string
  paid_player: string
  drawn_at: string
}

export interface Draw {
  id: string
  session_id: string
  created_at: string
  spot_name: string
  draw_count: number
  results: DrawResult[]
}

export interface Session {
  id: string
  created_at: string
  break_name: string
  give_players: string[]
  paid_spots: { name: string; giveCount: number; reservedGives?: string[] }[]
}

export type AppView = 'wheel' | 'admin' | 'history'

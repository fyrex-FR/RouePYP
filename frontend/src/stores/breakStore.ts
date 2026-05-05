import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { AppView, GivePlayer, PaidSpot } from '../types'

export interface LiveResult {
  give_player: string
  paid_player: string
  drawn_at: string
  spot: string
}

interface BreakStore {
  view: AppView
  setView: (v: AppView) => void

  breakName: string
  setBreakName: (name: string) => void

  givePlayers: GivePlayer[]
  setGivePlayers: (players: GivePlayer[]) => void
  addGivePlayer: (name: string) => void
  removeGivePlayer: (id: string) => void

  allPaidSpots: PaidSpot[]
  paidSpots: PaidSpot[]
  setPaidSpots: (spots: PaidSpot[]) => void
  loadSessionSpots: (allSpots: PaidSpot[], remainingSpots: PaidSpot[]) => void
  addPaidSpot: (name: string) => void
  removePaidSpot: (id: string) => void

  sessionId: string | null
  setSessionId: (id: string | null) => void

  drawnPlayers: string[]
  markDrawn: (playerName: string) => void
  setDrawnPlayers: (players: string[]) => void
  resetDrawn: () => void

  liveResults: LiveResult[]
  addLiveResults: (results: LiveResult[]) => void
  clearLiveResults: () => void

  resetTirage: () => void
}

export const useBreakStore = create<BreakStore>()(
  persist(
    (set) => ({
      view: 'wheel',
      setView: (v) => set({ view: v }),

      breakName: '',
      setBreakName: (name) => set({ breakName: name }),

      givePlayers: [],
      setGivePlayers: (players) => set({ givePlayers: players }),
      addGivePlayer: (name) =>
        set((s) => ({ givePlayers: [...s.givePlayers, { id: nanoid(), name }] })),
      removeGivePlayer: (id) =>
        set((s) => ({ givePlayers: s.givePlayers.filter((p) => p.id !== id) })),

      allPaidSpots: [],
      paidSpots: [],
      setPaidSpots: (spots) => set({ paidSpots: spots, allPaidSpots: spots }),
      loadSessionSpots: (allSpots, remainingSpots) =>
        set({ paidSpots: remainingSpots, allPaidSpots: allSpots }),
      addPaidSpot: (name) =>
        set((s) => {
          const spot = { id: nanoid(), name }
          return {
            paidSpots: [...s.paidSpots, spot],
            allPaidSpots: [...s.allPaidSpots, spot],
          }
        }),
      removePaidSpot: (id) =>
        set((s) => ({ paidSpots: s.paidSpots.filter((p) => p.id !== id) })),

      sessionId: null,
      setSessionId: (id) => set({ sessionId: id }),

      drawnPlayers: [],
      markDrawn: (playerName) =>
        set((s) => ({ drawnPlayers: [...s.drawnPlayers, playerName] })),
      setDrawnPlayers: (players) => set({ drawnPlayers: players }),
      resetDrawn: () => set({ drawnPlayers: [] }),

      liveResults: [],
      addLiveResults: (results) =>
        set((s) => ({ liveResults: [...s.liveResults, ...results] })),
      clearLiveResults: () => set({ liveResults: [] }),

      resetTirage: () =>
        set((s) => ({
          drawnPlayers: [],
          liveResults: [],
          paidSpots: s.allPaidSpots.length > 0 ? [...s.allPaidSpots] : [...s.paidSpots],
        })),
    }),
    {
      name: 'rouuuuue-break-store-v2',
      onRehydrateStorage: () => (state) => {
        if (state && state.allPaidSpots.length === 0 && state.paidSpots.length > 0) {
          state.allPaidSpots = [...state.paidSpots]
        }
      },
    }
  )
)

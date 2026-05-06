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
  addPaidSpot: (name: string, giveCount?: number) => void
  removePaidSpot: (id: string) => void

  sessionId: string | null
  setSessionId: (id: string | null) => void

  drawnPlayers: string[]
  markDrawn: (playerName: string) => void
  unmarkDrawn: (playerNames: string[]) => void
  setDrawnPlayers: (players: string[]) => void
  resetDrawn: () => void

  liveResults: LiveResult[]
  addLiveResults: (results: LiveResult[]) => void
  removeLiveResultsForSpot: (spotName: string) => void
  clearLiveResults: () => void

  restorePaidSpot: (name: string) => void
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
      addPaidSpot: (name, giveCount = 1) =>
        set((s) => {
          const spot = { id: nanoid(), name, giveCount }
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
      unmarkDrawn: (playerNames) =>
        set((s) => ({
          drawnPlayers: s.drawnPlayers.filter((name) => !playerNames.includes(name)),
        })),
      setDrawnPlayers: (players) => set({ drawnPlayers: players }),
      resetDrawn: () => set({ drawnPlayers: [] }),

      liveResults: [],
      addLiveResults: (results) =>
        set((s) => ({ liveResults: [...s.liveResults, ...results] })),
      removeLiveResultsForSpot: (spotName) =>
        set((s) => ({ liveResults: s.liveResults.filter((r) => r.spot !== spotName) })),
      clearLiveResults: () => set({ liveResults: [] }),

      restorePaidSpot: (name) =>
        set((s) => {
          const spotExists = s.paidSpots.some((spot) => spot.name === name)
          const allSpotExists = s.allPaidSpots.some((spot) => spot.name === name)
          const originalGiveCount = s.allPaidSpots.find((spot) => spot.name === name)?.giveCount ?? 1
          const restoredSpot = { id: nanoid(), name, giveCount: originalGiveCount }
          return {
            paidSpots: spotExists ? s.paidSpots : [...s.paidSpots, restoredSpot],
            allPaidSpots: allSpotExists ? s.allPaidSpots : [...s.allPaidSpots, restoredSpot],
          }
        }),

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

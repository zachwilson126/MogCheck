import { create } from 'zustand';
import { AnalysisResult } from '../analysis';

export interface BattlePlayer {
  userId: string | null;
  username: string | null;
  scanId: string;
  analysis: AnalysisResult;
}

interface BattleState {
  battleId: string | null;
  battleLink: string | null;
  challenger: BattlePlayer | null;
  opponent: BattlePlayer | null;
  winnerId: string | null;
  verdict: string | null;
  status: 'idle' | 'waiting' | 'ready' | 'complete';

  setBattle: (battleId: string, battleLink: string) => void;
  setChallenger: (player: BattlePlayer) => void;
  setOpponent: (player: BattlePlayer) => void;
  setWinner: (winnerId: string) => void;
  setVerdict: (verdict: string) => void;
  setStatus: (status: BattleState['status']) => void;
  reset: () => void;
}

export const useBattleStore = create<BattleState>()((set) => ({
  battleId: null,
  battleLink: null,
  challenger: null,
  opponent: null,
  winnerId: null,
  verdict: null,
  status: 'idle',

  setBattle: (battleId, battleLink) => set({ battleId, battleLink }),
  setChallenger: (player) => set({ challenger: player }),
  setOpponent: (player) => set({ opponent: player }),
  setWinner: (winnerId) => set({ winnerId, status: 'complete' }),
  setVerdict: (verdict) => set({ verdict }),
  setStatus: (status) => set({ status }),
  reset: () => set({
    battleId: null,
    battleLink: null,
    challenger: null,
    opponent: null,
    winnerId: null,
    verdict: null,
    status: 'idle',
  }),
}));

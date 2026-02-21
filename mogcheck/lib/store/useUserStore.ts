import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { AnalysisResult } from '../analysis';
import { supabase, getProfile, saveScanToServer, logCoinTransaction } from '../api/supabase';

export interface ScanHistoryEntry {
  id: string;
  score: number;
  tierName: string;
  analyzedAt: string;
  /** Serialized analysis for results detail view */
  analysis: AnalysisResult;
  /** Local photo URI (may become unavailable after app restart) */
  photoUri: string | null;
}

interface UserState {
  // Auth
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;

  // Profile
  coins: number;
  totalScans: number;
  highestScore: number;
  currentTier: string | null;
  username: string | null;

  // Local
  scanHistory: ScanHistoryEntry[];
  disclaimerAccepted: boolean;
  /** Whether we're currently syncing with server */
  isSyncing: boolean;

  // Auth actions
  setAuth: (user: User | null, session: Session | null) => void;
  syncWithServer: () => Promise<void>;

  // Coin actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number, type: string, referenceId?: string) => Promise<boolean>;

  // Scan actions
  addScan: (analysis: AnalysisResult, photoUri?: string) => void;

  // Other
  acceptDisclaimer: () => void;
  setUsername: (username: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      session: null,
      isAuthenticated: false,

      // Profile
      coins: 3,
      totalScans: 0,
      highestScore: 0,
      currentTier: null,
      username: null,

      // Local
      scanHistory: [],
      disclaimerAccepted: false,
      isSyncing: false,

      setAuth: (user, session) => set({
        user,
        session,
        isAuthenticated: !!user,
      }),

      /**
       * Sync local state with Supabase profile.
       * Server is source of truth for coins.
       */
      syncWithServer: async () => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return;

        set({ isSyncing: true });
        try {
          const { data } = await getProfile(user.id);
          if (data) {
            set({
              coins: data.coins,
              totalScans: data.total_scans,
              highestScore: data.highest_score,
              currentTier: data.current_tier,
              username: data.username,
            });
          }
        } catch (err) {
          console.warn('Sync failed:', err);
        } finally {
          set({ isSyncing: false });
        }
      },

      addCoins: (amount) => set((state) => ({
        coins: state.coins + amount,
      })),

      /**
       * Spend coins — deducts locally immediately for responsiveness,
       * then logs to server. If server deduction fails, we revert.
       */
      spendCoins: async (amount, type, referenceId) => {
        const { coins, user, isAuthenticated } = get();
        if (coins < amount) return false;

        // Optimistic local deduction
        set({ coins: coins - amount });

        // Server-side logging (if authenticated)
        if (isAuthenticated && user) {
          const { error } = await logCoinTransaction(user.id, -amount, type, referenceId);
          if (error) {
            // Revert on failure
            set({ coins: coins });
            return false;
          }
          // Also update server profile coin balance
          await supabase
            .from('profiles')
            .update({ coins: coins - amount })
            .eq('id', user.id);
        }

        return true;
      },

      addScan: (analysis, photoUri) => set((state) => {
        const entry: ScanHistoryEntry = {
          id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          score: analysis.score,
          tierName: analysis.tier.name,
          analyzedAt: analysis.analyzedAt,
          analysis,
          photoUri: photoUri ?? null,
        };

        const newState = {
          totalScans: state.totalScans + 1,
          highestScore: Math.max(state.highestScore, analysis.score),
          currentTier: analysis.tier.name,
          scanHistory: [entry, ...state.scanHistory].slice(0, 50),
        };

        // Async server save (fire and forget)
        const { user, isAuthenticated } = get();
        if (isAuthenticated && user) {
          saveScanToServer(user.id, {
            score: analysis.score,
            tier: analysis.tier.name,
            symmetryScore: Math.round(analysis.symmetry.percentage),
            ratioData: Object.fromEntries(
              analysis.ratios.map((r) => [r.id, { measured: r.measured, score: r.score }]),
            ),
          }).catch((err) => console.warn('Server scan save failed:', err));

          // Update profile stats on server
          supabase
            .from('profiles')
            .update({
              total_scans: newState.totalScans,
              highest_score: newState.highestScore,
              current_tier: newState.currentTier,
            })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) console.warn('Profile update failed:', error.message);
            });
        }

        return newState;
      }),

      acceptDisclaimer: () => set({ disclaimerAccepted: true }),

      setUsername: (username) => set({ username }),

      reset: () => set({
        user: null,
        session: null,
        isAuthenticated: false,
        coins: 3,
        totalScans: 0,
        highestScore: 0,
        currentTier: null,
        username: null,
        scanHistory: [],
        disclaimerAccepted: false,
        isSyncing: false,
      }),
    }),
    {
      name: 'mogcheck-user-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist local-relevant data — auth comes from secure store
      partialize: (state) => ({
        coins: state.coins,
        totalScans: state.totalScans,
        highestScore: state.highestScore,
        currentTier: state.currentTier,
        username: state.username,
        scanHistory: state.scanHistory,
        disclaimerAccepted: state.disclaimerAccepted,
      }),
    },
  ),
);

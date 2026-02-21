import { create } from 'zustand';
import { AnalysisResult } from '../analysis';

interface ScanState {
  /** Whether a scan is currently in progress */
  isScanning: boolean;
  /** Current scan phase */
  phase: 'idle' | 'detecting' | 'analyzing' | 'complete';
  /** Captured photo URI (if needed for glow-up later) */
  photoUri: string | null;
  /** The analysis result once complete */
  result: AnalysisResult | null;
  /** Face detected and aligned within guide */
  faceAligned: boolean;
  /** Seconds face has been steady in guide */
  steadySeconds: number;
  /** Error message if scan failed */
  error: string | null;

  // Actions
  startScan: () => void;
  setFaceAligned: (aligned: boolean) => void;
  incrementSteady: () => void;
  resetSteady: () => void;
  setAnalyzing: () => void;
  setResult: (result: AnalysisResult, photoUri?: string) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  isScanning: false,
  phase: 'idle',
  photoUri: null,
  result: null,
  faceAligned: false,
  steadySeconds: 0,
  error: null,

  startScan: () => set({
    isScanning: true,
    phase: 'detecting',
    result: null,
    error: null,
    faceAligned: false,
    steadySeconds: 0,
    photoUri: null,
  }),

  setFaceAligned: (aligned) => set({ faceAligned: aligned }),

  incrementSteady: () => set((state) => ({ steadySeconds: state.steadySeconds + 1 })),

  resetSteady: () => set({ steadySeconds: 0 }),

  setAnalyzing: () => set({ phase: 'analyzing' }),

  setResult: (result, photoUri) => set({
    phase: 'complete',
    isScanning: false,
    result,
    photoUri: photoUri ?? null,
  }),

  setError: (error) => set({
    phase: 'idle',
    isScanning: false,
    error,
  }),

  reset: () => set({
    isScanning: false,
    phase: 'idle',
    photoUri: null,
    result: null,
    faceAligned: false,
    steadySeconds: 0,
    error: null,
  }),
}));

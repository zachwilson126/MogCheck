import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Custom storage adapter using expo-secure-store for auth tokens.
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Silently fail — secure store may not be available in some contexts
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Silently fail
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ==================
// Profile helpers
// ==================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, coins, total_scans, highest_score, current_tier, created_at')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ==================
// Coin helpers
// ==================

export async function getCoins(userId: string): Promise<number> {
  const { data } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();
  return data?.coins ?? 0;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function logCoinTransaction(
  userId: string,
  amount: number,
  type: string,
  referenceId?: string,
) {
  // reference_id is a uuid column — only pass valid UUIDs
  const safeRefId = referenceId && UUID_REGEX.test(referenceId) ? referenceId : null;

  const { error } = await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount,
    type,
    reference_id: safeRefId,
  });
  return { error };
}

// ==================
// Scan helpers
// ==================

export async function saveScanToServer(
  userId: string,
  scan: {
    score: number;
    tier: string;
    symmetryScore: number;
    ratioData: Record<string, unknown>;
    roastText?: string;
  },
) {
  const { data, error } = await supabase.from('scans').insert({
    user_id: userId,
    score: scan.score,
    tier: scan.tier,
    symmetry_score: scan.symmetryScore,
    ratio_data: scan.ratioData,
    roast_text: scan.roastText ?? null,
  }).select().single();
  return { data, error };
}

export async function getUserScans(userId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data, error };
}

// ==================
// Edge Function helpers
// ==================

export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  // Force refresh to avoid stale JWTs
  const { data: refreshData } = await supabase.auth.refreshSession();
  let token = refreshData?.session?.access_token;

  if (!token) {
    // Fallback to cached session
    const { data: sessionData } = await supabase.auth.getSession();
    token = sessionData?.session?.access_token ?? undefined;
  }

  if (!token) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as T, error: null };
}

/**
 * Generate a roast via the generate-roast edge function.
 */
export async function generateRoast(analysisData: {
  score: number;
  tier: string;
  strongestRatio: { name: string; score: number };
  weakestRatio: { name: string; score: number };
  symmetryScore: number;
  facialThirds: { upper: number; middle: number; lower: number };
  topRatios: { name: string; score: number }[];
  bottomRatios: { name: string; score: number }[];
}): Promise<{ roastText: string | null; error: string | null }> {
  const result = await callEdgeFunction<{ roast_text: string }>('generate-roast', analysisData);
  return {
    roastText: result.data?.roast_text ?? null,
    error: result.error,
  };
}

/**
 * Generate an ascension plan via the generate-ascension-plan edge function.
 */
export async function generateAscensionPlan(analysisData: {
  score: number;
  tier: string;
  weakestRatios: { name: string; score: number }[];
  symmetryScore: number;
  facialThirds: { upper: number; middle: number; lower: number };
}): Promise<{ plan: string | null; error: string | null }> {
  const result = await callEdgeFunction<{ plan: string }>('generate-ascension-plan', analysisData);
  return {
    plan: result.data?.plan ?? null,
    error: result.error,
  };
}

// ==================
// Transform (Glow Up) helpers
// ==================

/**
 * Generate a "Glow Up" transformation via the generate-transform edge function.
 * Uses supabase.functions.invoke which handles JWT auth headers correctly.
 * Returns a base64-encoded transformed image.
 */
export async function generateTransform(
  imageUri: string,
  analysis: {
    score: number;
    tier: string;
    weakestRatios: { name: string; score: number }[];
    symmetryScore: number;
  },
): Promise<{ transformedImage: string | null; disclaimer: string | null; error: string | null }> {
  try {
    // Force token refresh to avoid stale JWTs
    await supabase.auth.refreshSession();
    const { data: freshSession } = await supabase.auth.getSession();
    const token = freshSession?.session?.access_token;

    if (!token) {
      return { transformedImage: null, disclaimer: null, error: 'Not authenticated. Sign in to use Glow Up.' };
    }

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'scan.jpg',
    } as unknown as Blob);
    formData.append('analysis', JSON.stringify(analysis));

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-transform`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
      body: formData,
    });

    const responseText = await response.text();

    if (__DEV__) {
      console.log('[MogCheck] Transform response:', response.status, responseText.slice(0, 500));
    }

    if (!response.ok) {
      let errorMsg = 'Transform failed';
      try {
        const parsed = JSON.parse(responseText);
        errorMsg = parsed.error ?? parsed.message ?? errorMsg;
      } catch {
        errorMsg = `Transform failed (${response.status})`;
      }
      return { transformedImage: null, disclaimer: null, error: errorMsg };
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      return { transformedImage: null, disclaimer: null, error: 'Unexpected server response.' };
    }

    return {
      transformedImage: (data.transformed_image as string) ?? null,
      disclaimer: (data.disclaimer as string) ?? null,
      error: (data.error as string) ?? null,
    };
  } catch (err) {
    if (__DEV__) console.error('[MogCheck] Transform error:', err);
    return { transformedImage: null, disclaimer: null, error: 'Network error. Please try again.' };
  }
}

// ==================
// Battle helpers
// ==================

function generateBattleCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createBattle(challengerId: string, challengerScanId: string) {
  const battleLink = generateBattleCode();
  const { data, error } = await supabase
    .from('battles')
    .insert({
      challenger_id: challengerId,
      challenger_scan_id: challengerScanId,
      battle_link: battleLink,
    })
    .select('id, battle_link')
    .single();
  return { data, error };
}

export async function getBattleByLink(battleLink: string) {
  const { data, error } = await supabase
    .from('battles')
    .select('id, challenger_id, challenger_scan_id, opponent_id, opponent_scan_id, winner_id, battle_link, status, created_at')
    .eq('battle_link', battleLink)
    .single();
  return { data, error };
}

export async function getBattleById(battleId: string) {
  const { data, error } = await supabase
    .from('battles')
    .select('id, challenger_id, challenger_scan_id, opponent_id, opponent_scan_id, winner_id, battle_link, status, created_at')
    .eq('id', battleId)
    .single();
  return { data, error };
}

export async function joinBattle(battleId: string, opponentId: string, opponentScanId: string) {
  const { data, error } = await supabase
    .from('battles')
    .update({
      opponent_id: opponentId,
      opponent_scan_id: opponentScanId,
    })
    .eq('id', battleId)
    .select('id, challenger_id, challenger_scan_id, opponent_id, opponent_scan_id, battle_link, status')
    .single();
  return { data, error };
}

export async function completeBattle(battleId: string, winnerId: string) {
  const { data, error } = await supabase
    .from('battles')
    .update({
      winner_id: winnerId,
      status: 'completed' as const,
    })
    .eq('id', battleId)
    .select()
    .single();
  return { data, error };
}

export async function getScanById(scanId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('id, user_id, score, tier, symmetry_score, ratio_data, roast_text, created_at')
    .eq('id', scanId)
    .single();
  return { data, error };
}

export async function getUserBattles(userId: string) {
  const { data, error } = await supabase
    .from('battles')
    .select('id, challenger_id, opponent_id, winner_id, battle_link, status, created_at')
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(20);
  return { data, error };
}

/**
 * Generate a battle verdict via the generate-battle-verdict edge function.
 */
export async function generateBattleVerdict(battleData: {
  challengerScore: number;
  challengerTier: string;
  opponentScore: number;
  opponentTier: string;
  challengerStrength: string;
  challengerWeakness: string;
  opponentStrength: string;
  opponentWeakness: string;
  scoreDifference: number;
}): Promise<{ verdict: string | null; error: string | null }> {
  const result = await callEdgeFunction<{ verdict_text: string }>('generate-battle-verdict', battleData);
  return {
    verdict: result.data?.verdict_text ?? null,
    error: result.error,
  };
}

// ==================
// Leaderboard helpers
// ==================

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, username, highest_score, tier, updated_at')
    .eq('opted_in', true)
    .order('highest_score', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function upsertLeaderboardEntry(userId: string, username: string, score: number, tier: string) {
  const { data, error } = await supabase
    .from('leaderboard')
    .upsert({
      user_id: userId,
      username,
      highest_score: score,
      tier,
      opted_in: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
}

export async function removeFromLeaderboard(userId: string) {
  const { error } = await supabase
    .from('leaderboard')
    .update({ opted_in: false })
    .eq('user_id', userId);
  return { error };
}

export async function getLeaderboardEntry(userId: string) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, username, highest_score, tier, opted_in, updated_at')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

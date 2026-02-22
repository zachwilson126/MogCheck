/**
 * Authentication helpers wrapping Supabase auth.
 */

import { supabase, getProfile } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

/**
 * Sign up with email and password.
 * Creates a profile row via a Supabase trigger (or manually).
 * Returns `needsConfirmation: true` when email verification is required.
 */
export async function signUp(email: string, password: string, username?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) return { user: null, needsConfirmation: false, error: error.message };

  // Create profile if sign-up succeeded
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: username ?? null,
      coins: Number(process.env.EXPO_PUBLIC_FREE_COINS_ON_SIGNUP ?? 3),
    });

    if (profileError && !profileError.message.includes('duplicate')) {
      if (__DEV__) console.warn('Profile creation error:', profileError.message);
    }
  }

  // If Supabase returned a user but no session, email confirmation is required
  const needsConfirmation = !!data.user && !data.session;

  return { user: data.user, needsConfirmation, error: null };
}

/**
 * Sign in with email and password.
 * Provides user-friendly error messages for common Supabase auth failures.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('email not confirmed')) {
      return { user: null, session: null, error: 'email_not_confirmed' };
    }
    if (msg.includes('invalid login credentials')) {
      return { user: null, session: null, error: 'Wrong email or password.' };
    }
    return { user: null, session: null, error: error.message };
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Resend the confirmation email for a given address.
 */
export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  return { error: error?.message ?? null };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

/**
 * Get the current session.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error: error?.message ?? null };
}

/**
 * Listen for auth state changes.
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

/**
 * Sync local user state with Supabase profile.
 */
export async function syncProfile(userId: string) {
  const { data, error } = await getProfile(userId);
  if (error || !data) return null;
  return data;
}

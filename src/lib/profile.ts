import { supabase } from './supabaseClient';
import type { Profile } from './types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as Profile | null;
}

export async function upsertProfile(
  userId: string,
  patch: Partial<Profile>
): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() })
    .select('*')
    .maybeSingle();
  return data as Profile | null;
}

export async function ensureProfile(userId: string, meta: { full_name?: string; avatar_url?: string; provider?: string }) {
  const existing = await getProfile(userId);
  if (existing) return existing;
  return upsertProfile(userId, {
    full_name: meta.full_name ?? '',
    avatar_url: meta.avatar_url ?? '',
    provider: meta.provider ?? 'google',
    gmail_connected: false,
    account_status: 'active',
  });
}

import { supabase } from './supabaseClient';
import type { UserSettings } from './types';

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'updated_at'> = {
  default_tone: 'Professional',
  ai_model: 'gpt-4o-mini',
  theme: 'dark',
  auto_save: true,
  auto_reply: false,
  notifications: true,
  signature: '',
};

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (data) return data as UserSettings;

  const insert = { ...DEFAULT_SETTINGS, user_id: userId };
  const { data: inserted } = await supabase
    .from('user_settings')
    .insert(insert)
    .select('*')
    .maybeSingle();
  return (inserted as UserSettings) ?? { ...insert, updated_at: new Date().toISOString() };
}

export async function updateSettings(
  userId: string,
  patch: Partial<UserSettings>
): Promise<UserSettings | null> {
  const { data } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() })
    .select('*')
    .maybeSingle();
  return data as UserSettings | null;
}

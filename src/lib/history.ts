import { supabase } from './supabaseClient';
import type { HistoryEntry } from './types';

export async function listHistory(userId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('email_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as HistoryEntry[];
}

export async function saveHistory(
  entry: Omit<HistoryEntry, 'id' | 'user_id' | 'created_at'>
): Promise<HistoryEntry | null> {
  const { data, error } = await supabase
    .from('email_history')
    .insert(entry)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as HistoryEntry | null;
}

export async function updateHistory(
  id: string,
  patch: Partial<HistoryEntry>
): Promise<void> {
  const { error } = await supabase.from('email_history').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteHistory(id: string): Promise<void> {
  const { error } = await supabase.from('email_history').delete().eq('id', id);
  if (error) throw error;
}

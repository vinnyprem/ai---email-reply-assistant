import { supabase } from './supabaseClient';
import type { EmailMessage } from './types';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-proxy`;

export interface GmailStatus {
  connected: boolean;
  message?: string;
}

interface GmailResponse extends GmailStatus {
  messages?: EmailMessage[];
  message?: EmailMessage | string;
  sent?: boolean;
  starred?: boolean;
  deleted?: boolean;
  id?: string;
  error?: string;
}

async function callGmail<T extends GmailResponse>(payload: Record<string, unknown>): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token ?? '';
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error ?? `Gmail request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function getGmailStatus(): Promise<GmailStatus> {
  try {
    const r = await callGmail<GmailResponse>({ action: 'status' });
    return { connected: !!r.gmailConnected, message: r.error };
  } catch {
    return { connected: false, message: 'Gmail not connected' };
  }
}

export async function fetchInbox(query?: string, maxResults = 20): Promise<{ messages: EmailMessage[]; connected: boolean }> {
  const r = await callGmail<GmailResponse>({ action: 'list', query, maxResults });
  if (!r.gmailConnected) {
    throw new Error(r.error ?? 'Gmail not connected');
  }
  return { messages: r.messages ?? [], connected: true };
}

export async function getEmail(messageId: string): Promise<{ message: EmailMessage | null; connected: boolean }> {
  const r = await callGmail<GmailResponse>({ action: 'get', messageId });
  if (!r.gmailConnected) {
    throw new Error(r.error ?? 'Gmail not connected');
  }
  return { message: (r.message as EmailMessage) ?? null, connected: true };
}

export interface SendArgs {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}

export async function sendEmail(args: SendArgs): Promise<{ sent: boolean; connected: boolean; id?: string }> {
  const r = await callGmail<GmailResponse>({ action: 'send', ...args });
  if (!r.gmailConnected) {
    throw new Error(r.error ?? 'Gmail not connected');
  }
  return { sent: !!r.sent, connected: true, id: r.id };
}

export async function starEmail(messageId: string): Promise<boolean> {
  const r = await callGmail<GmailResponse>({ action: 'star', messageId });
  return !!r.gmailConnected;
}

export async function markRead(messageId: string, read: boolean): Promise<boolean> {
  const r = await callGmail<GmailResponse>({
    action: read ? 'markRead' : 'markUnread',
    messageId,
  });
  return !!r.gmailConnected;
}

export async function deleteEmail(messageId: string): Promise<boolean> {
  const r = await callGmail<GmailResponse>({ action: 'delete', messageId });
  return !!r.gmailConnected;
}

export function resetGmailStatusCache() {}

export async function storeGoogleTokens(args: {
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scope: string;
}): Promise<boolean> {
  const { error } = await supabase
    .from('google_tokens')
    .upsert({
      user_id: args.userId,
      access_token: args.accessToken,
      refresh_token: args.refreshToken,
      expires_at: args.expiresAt,
      scope: args.scope,
      token_type: 'Bearer',
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to store Google tokens:', error.message);
    return false;
  }
  return true;
}

export async function hasGoogleTokens(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return false;

  const { data, error } = await supabase
    .from('google_tokens')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

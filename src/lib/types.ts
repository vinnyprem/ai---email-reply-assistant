export type Tone =
  | 'Professional'
  | 'Friendly'
  | 'Formal'
  | 'Casual'
  | 'Thank You'
  | 'Apology'
  | 'Follow Up';

export const TONES: Tone[] = [
  'Professional',
  'Friendly',
  'Formal',
  'Casual',
  'Thank You',
  'Apology',
  'Follow Up',
];

export interface EmailMessage {
  id: string;
  threadId?: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  important: boolean;
  label?: string;
}

export interface HistoryEntry {
  id: string;
  original_sender: string;
  original_recipient: string;
  original_subject: string;
  original_body: string;
  generated_reply: string;
  tone: string;
  status: 'draft' | 'sent';
  important: boolean;
  created_at: string;
  response_time_ms?: number | null;
  intent?: string | null;
  priority?: string | null;
  sentiment?: string | null;
}

export interface UserSettings {
  user_id: string;
  default_tone: string;
  ai_model: string;
  theme: 'dark' | 'light';
  auto_save: boolean;
  auto_reply: boolean;
  notifications: boolean;
  signature: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string;
  provider: string;
  gmail_connected: boolean;
  account_status: string;
  updated_at: string;
}

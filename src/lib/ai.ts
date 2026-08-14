import type { EmailMessage, Tone } from './types';
import { supabase } from './supabaseClient';

export interface GenerateOptions {
  tone: Tone;
  signature?: string;
  instruction?: 'improve' | 'shorter' | 'longer' | 'none';
  language?: string;
}

export interface GenerateResult {
  reply: string;
}

export interface AnalysisResult {
  intent: string;
  priority: 'High' | 'Medium' | 'Low';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  actionItems: string[];
  summary: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

async function callAI<T = string>(payload: Record<string, unknown>): Promise<T> {
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
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? `AI request failed (${res.status})`);
  }
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result as T;
}

export async function generateReply(
  email: EmailMessage,
  options: GenerateOptions
): Promise<GenerateResult> {
  const reply = await callAI<string>({
    action: 'reply',
    email: { sender: email.sender, senderEmail: email.senderEmail, recipient: email.recipient, subject: email.subject, body: email.body },
    tone: options.tone,
  });
  let final = reply;
  if (options.instruction && options.instruction !== 'none') {
    final = await callAI<string>({ action: options.instruction, reply: final, tone: options.tone });
  }
  if (options.signature && options.signature.trim()) {
    final = `${final}\n\n${options.signature.trim()}`;
  }
  return { reply: final };
}

export async function summarizeEmail(email: EmailMessage): Promise<string> {
  return callAI<string>({
    action: 'summarize',
    email: { sender: email.sender, subject: email.subject, body: email.body },
  });
}

export async function suggestSubject(email: EmailMessage): Promise<string> {
  return callAI<string>({
    action: 'subject',
    email: { subject: email.subject, body: email.body },
  });
}

export async function translateReply(reply: string, language: string): Promise<string> {
  return callAI<string>({ action: 'translate', reply, language });
}

export async function rewriteReply(reply: string, style: 'friendly' | 'formal'): Promise<string> {
  return callAI<string>({ action: `rewrite_${style}`, reply });
}

export async function improveReply(reply: string): Promise<string> {
  return callAI<string>({ action: 'improve', reply });
}

export async function correctGrammarAndSpelling(text: string): Promise<string> {
  return callAI<string>({ action: 'grammar', text });
}

export async function analyzeEmail(email: EmailMessage): Promise<AnalysisResult> {
  const e = { sender: email.sender, subject: email.subject, body: email.body };
  const [intent, priority, sentiment, actionItems, summary] = await Promise.all([
    callAI<string>({ action: 'intent', email: e }),
    callAI<string>({ action: 'priority', email: e }),
    callAI<string>({ action: 'sentiment', email: e }),
    callAI<string>({ action: 'action_items', email: e }),
    callAI<string>({ action: 'summarize', email: e }),
  ]);
  let parsedItems: string[] = [];
  try {
    parsedItems = JSON.parse(actionItems);
    if (!Array.isArray(parsedItems)) parsedItems = [actionItems];
  } catch {
    parsedItems = [actionItems];
  }
  return {
    intent: intent || 'Unknown',
    priority: (priority as AnalysisResult['priority']) || 'Medium',
    sentiment: (sentiment as AnalysisResult['sentiment']) || 'Neutral',
    actionItems: parsedItems,
    summary: summary || '',
  };
}

import { useState } from 'react';
import {
  Copy,
  RefreshCw,
  Sparkles,
  Minus,
  Plus,
  Languages,
  Send,
  Loader2,
  Check,
  Wand2,
} from 'lucide-react';
import type { EmailMessage, Tone } from '@/lib/types';
import { TONES } from '@/lib/types';
import {
  generateReply,
  translateReply,
  correctGrammarAndSpelling,
  improveReply,
  rewriteReply,
  type GenerateOptions,
} from '@/lib/ai';
import { sendEmail } from '@/lib/gmail';
import { useToast } from '@/components/Toast';

interface Props {
  email: EmailMessage;
  defaultTone: Tone;
  signature?: string;
  onSent: (reply: string, tone: Tone) => void;
  onClose: () => void;
  threadId?: string;
}

const LANGS = ['Spanish', 'French', 'German', 'Hindi', 'Japanese', 'Arabic'];

export function ReplyEditor({ email, defaultTone, signature, onSent, onClose, threadId }: Props) {
  const { notify } = useToast();
  const [tone, setTone] = useState<Tone>(defaultTone);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLangs, setShowLangs] = useState(false);

  const run = async (instruction: GenerateOptions['instruction'] = 'none') => {
    setLoading(true);
    try {
      const { reply: text } = await generateReply(email, { tone, signature, instruction });
      setReply(text);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => run('none');
  const handleRegenerate = () => run('none');
  const handleImprove = () => run('improve');
  const handleShorter = () => run('shorter');
  const handleLonger = () => run('longer');

  const handleGrammar = async () => {
    setLoading(true);
    const corrected = await correctGrammarAndSpelling(reply);
    setReply(corrected);
    setLoading(false);
    notify('Grammar & spelling corrected', 'success');
  };

  const handleRewrite = async (style: 'friendly' | 'formal') => {
    setLoading(true);
    const rewritten = await rewriteReply(reply, style);
    setReply(rewritten);
    setLoading(false);
    notify(`Rewritten in ${style} tone`, 'success');
  };

  const handleTranslate = async (lang: string) => {
    setShowLangs(false);
    setLoading(true);
    const translated = await translateReply(reply, lang);
    setReply(translated);
    setLoading(false);
    notify(`Translated to ${lang}`, 'success');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    notify('Copied to clipboard', 'success');
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { sent, connected } = await sendEmail({
        to: email.senderEmail,
        subject: `Re: ${email.subject}`,
        body: reply,
        threadId,
      });
      setSending(false);
      if (!connected || !sent) {
        notify('Could not send email via Gmail', 'error');
        return;
      }
      notify('Email sent successfully via Gmail', 'success');
      onSent(reply, tone);
      onClose();
    } catch {
      setSending(false);
      notify('Could not send email', 'error');
    }
  };

  return (
    <div className="card p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15">
            <Sparkles size={16} className="text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Reply Editor</h3>
            <p className="text-[11px] text-ink-500">Edit, refine, and send your reply</p>
          </div>
        </div>
        <button onClick={onClose} className="text-ink-500 hover:text-ink-200 text-sm">
          Close
        </button>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-ink-400 mb-2">Tone</p>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`chip ${
                tone === t
                  ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
                  : 'border-ink-700 text-ink-400 hover:text-ink-200 hover:border-ink-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {!reply && !loading && (
          <button
            onClick={handleGenerate}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700 bg-ink-850/40 py-10 text-ink-400 hover:border-brand-500/50 hover:text-brand-300 transition"
          >
            <Wand2 size={22} />
            <span className="text-sm font-medium">Click to generate an AI reply</span>
            <span className="text-xs text-ink-500">Tone: {tone}</span>
          </button>
        )}

        {(reply || loading) && (
          <div className="relative">
            <textarea
              value={loading ? 'Generating…' : reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={loading}
              rows={10}
              placeholder="Your AI-generated reply will appear here…"
              className="input resize-y font-mono text-[13px] leading-relaxed"
            />
            {loading && (
              <div className="absolute right-3 top-3 flex items-center gap-1.5 text-xs text-brand-300">
                <Loader2 size={14} className="animate-spin" /> AI is writing…
              </div>
            )}
          </div>
        )}
      </div>

      {reply && !loading && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={handleCopy} className="btn-outline text-xs px-3 py-2">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleRegenerate} className="btn-outline text-xs px-3 py-2">
            <RefreshCw size={14} /> Regenerate
          </button>
          <button onClick={handleImprove} className="btn-outline text-xs px-3 py-2">
            <Sparkles size={14} /> Improve
          </button>
          <button onClick={handleShorter} className="btn-outline text-xs px-3 py-2">
            <Minus size={14} /> Shorter
          </button>
          <button onClick={handleLonger} className="btn-outline text-xs px-3 py-2">
            <Plus size={14} /> Longer
          </button>
          <button onClick={handleGrammar} className="btn-outline text-xs px-3 py-2">
            <Wand2 size={14} /> Grammar
          </button>
          <button onClick={() => handleRewrite('friendly')} className="btn-outline text-xs px-3 py-2">
            <Sparkles size={14} /> Friendly
          </button>
          <button onClick={() => handleRewrite('formal')} className="btn-outline text-xs px-3 py-2">
            <Sparkles size={14} /> Formal
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLangs((s) => !s)}
              className="btn-outline text-xs px-3 py-2"
            >
              <Languages size={14} /> Translate
            </button>
            {showLangs && (
              <div className="absolute z-20 mt-1 w-36 rounded-xl border border-ink-700 bg-ink-900 p-1 shadow-card">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleTranslate(l)}
                    className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-ink-200 hover:bg-ink-800"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className="btn-primary ml-auto text-xs px-4 py-2"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send size={14} /> Send
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

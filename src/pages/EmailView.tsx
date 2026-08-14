import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Sparkles,
  FileText,
  ListChecks,
  Mail,
  Wand2,
  ChevronRight,
  Target,
  Flag,
  Smile,
  CheckSquare,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { getEmail, sendEmail, starEmail, markRead } from '@/lib/gmail';
import type { EmailMessage, Tone } from '@/lib/types';
import { formatFullDate, initials } from '@/lib/format';
import { DetailSkeleton } from '@/components/Skeletons';
import { ReplyEditor } from '@/components/ReplyEditor';
import { summarizeEmail, suggestSubject, analyzeEmail, type AnalysisResult } from '@/lib/ai';
import { useAuth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { saveHistory } from '@/lib/history';
import { useToast } from '@/components/Toast';

export function EmailView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const emailId = params.get('email');

  const [email, setEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [suggestedSubject, setSuggestedSubject] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [defaultTone, setDefaultTone] = useState<Tone>('Professional');
  const [signature, setSignature] = useState<string>('');

  useEffect(() => {
    setLoadError(null);
    getEmail(emailId ?? '')
      .then(({ message, connected }) => {
        setEmail(message);
        setLoading(false);
        if (message && connected) {
          markRead(message.id, true).catch(() => {});
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Could not load email');
        setLoading(false);
      });
    if (user) {
      getSettings(user.id).then((s) => {
        setDefaultTone(s.default_tone as Tone);
        setSignature(s.signature ?? '');
      });
    }
  }, [emailId, user]);

  const handleSummarize = async () => {
    if (!email) return;
    setSummarizing(true);
    const text = await summarizeEmail(email);
    setSummary(text);
    setSummarizing(false);
  };

  const handleSuggestSubject = async () => {
    if (!email) return;
    const s = await suggestSubject(email);
    setSuggestedSubject(s);
    notify('Suggested subject generated', 'success');
  };

  const handleAnalyze = async () => {
    if (!email) return;
    setAnalyzing(true);
    const result = await analyzeEmail(email);
    setAnalysis(result);
    setSummarizing(false);
    setSummary(result.summary || summary);
    setAnalyzing(false);
  };

  const handleImportant = async () => {
    if (!email) return;
    setEmail({ ...email, important: !email.important });
    if (!email.important) await starEmail(email.id).catch(() => {});
    notify(email.important ? 'Removed important flag' : 'Marked as important', 'success');
  };

  const handleSent = async (reply: string, tone: Tone) => {
    if (!user || !email) return;
    const start = performance.now();
    try {
      await saveHistory({
        original_sender: email.sender,
        original_recipient: email.recipient,
        original_subject: email.subject,
        original_body: email.body,
        generated_reply: reply,
        tone,
        status: 'sent',
        important: email.important,
        response_time_ms: Math.round(performance.now() - start),
        intent: analysis?.intent ?? null,
        priority: analysis?.priority ?? null,
        sentiment: analysis?.sentiment ?? null,
        gmail_message_id: email.id,
        gmail_thread_id: email.threadId ?? null,
      });
      notify('Reply saved to history', 'success');
    } catch {
      notify('Could not save to history', 'error');
    }
  };

  if (loading) return <DetailSkeleton />;

  if (loadError) {
    return (
      <div className="card p-10 text-center">
        <AlertCircle size={28} className="mx-auto text-rose-400" />
        <p className="mt-3 text-sm font-medium text-ink-200">{loadError}</p>
        <button onClick={() => navigate('/app/inbox')} className="btn-ghost mt-4">
          Back to inbox
        </button>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="card p-10 text-center">
        <Mail size={28} className="mx-auto text-ink-500" />
        <p className="mt-3 text-sm font-medium text-ink-200">Email not found</p>
        <button onClick={() => navigate('/app/inbox')} className="btn-ghost mt-4">
          Back to inbox
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/app/inbox')}
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white transition"
      >
        <ArrowLeft size={16} /> Back to inbox
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-white">{email.subject}</h1>
            <p className="text-xs text-ink-500 mt-1">{formatFullDate(email.date)}</p>
          </div>
          <button
            onClick={handleImportant}
            className={`chip ${
              email.important
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                : 'border-ink-700 text-ink-400 hover:text-amber-300'
            }`}
          >
            <Star size={12} className={email.important ? 'fill-amber-300' : ''} />
            {email.important ? 'Important' : 'Mark Important'}
          </button>
        </div>

        <div className="mt-5 flex items-start gap-3 border-y border-ink-800 py-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-800 text-sm font-semibold text-ink-200">
            {initials(email.sender)}
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-white">{email.sender}</p>
            <p className="text-xs text-ink-400">{email.senderEmail}</p>
            <p className="text-xs text-ink-500 mt-1">to {email.recipient}</p>
          </div>
        </div>

        <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink-200">
          {email.body}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setShowEditor(true)} className="btn-primary text-sm">
            <Sparkles size={16} /> Generate Reply
          </button>
          <button onClick={handleSummarize} className="btn-outline text-sm">
            <FileText size={16} /> {summarizing ? 'Summarizing…' : 'Summarize'}
          </button>
          <button onClick={handleSuggestSubject} className="btn-outline text-sm">
            <ListChecks size={16} /> Suggested Subject
          </button>
          <button onClick={handleAnalyze} className="btn-outline text-sm">
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
            {analyzing ? 'Analyzing…' : 'AI Analyze'}
          </button>
          <button onClick={() => setShowEditor(true)} className="btn-outline text-sm">
            <Wand2 size={16} /> One-click Reply
          </button>
        </div>

        {analysis && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            <AnalysisChip icon={Target} label="Intent" value={analysis.intent} color="brand" />
            <AnalysisChip icon={Flag} label="Priority" value={analysis.priority} color={analysis.priority === 'High' ? 'rose' : analysis.priority === 'Medium' ? 'amber' : 'emerald'} />
            <AnalysisChip icon={Smile} label="Sentiment" value={analysis.sentiment} color={analysis.sentiment === 'Negative' ? 'rose' : analysis.sentiment === 'Positive' ? 'emerald' : 'ink'} />
            <AnalysisChip icon={CheckSquare} label="Action items" value={`${analysis.actionItems.length} found`} color="violet" />
          </div>
        )}

        {analysis?.actionItems && analysis.actionItems.length > 0 && (
          <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 animate-fade-in">
            <p className="text-xs font-semibold text-violet-300 mb-2 flex items-center gap-1.5">
              <CheckSquare size={13} /> Action items
            </p>
            <ul className="space-y-1.5">
              {analysis.actionItems.map((item, i) => (
                <li key={i} className="text-xs text-ink-200 flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary && (
          <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 animate-fade-in">
            <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold mb-2">
              <FileText size={14} /> AI Summary
            </div>
            <pre className="whitespace-pre-wrap text-xs text-ink-200 font-sans leading-relaxed">
              {summary}
            </pre>
          </div>
        )}

        {suggestedSubject && (
          <div className="mt-3 rounded-xl border border-ink-700 bg-ink-850/50 p-3 text-xs text-ink-200 animate-fade-in">
            <span className="text-ink-500">Suggested subject: </span>
            <span className="text-white font-medium">{suggestedSubject}</span>
          </div>
        )}
      </div>

      {showEditor && (
        <div className="mt-4">
          <ReplyEditor
            email={email}
            defaultTone={defaultTone}
            signature={signature}
            threadId={email.threadId}
            onSent={handleSent}
            onClose={() => setShowEditor(false)}
          />
        </div>
      )}

      <button
        onClick={() => navigate('/app/inbox')}
        className="mt-5 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300"
      >
        Back to inbox <ChevronRight size={12} />
      </button>
    </div>
  );
}

function AnalysisChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: 'brand' | 'rose' | 'amber' | 'emerald' | 'violet' | 'ink';
}) {
  const colors: Record<string, string> = {
    brand: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    ink: 'border-ink-700 bg-ink-800/50 text-ink-300',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80">
        <Icon size={12} /> {label}
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

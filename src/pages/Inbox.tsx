import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Circle, MailOpen, Filter, RefreshCw, Loader2, AlertCircle, Mail } from 'lucide-react';
import { fetchInbox } from '@/lib/gmail';
import { useAuth } from '@/lib/auth';
import type { EmailMessage } from '@/lib/types';
import { formatTime, initials } from '@/lib/format';
import { InboxSkeleton } from '@/components/Skeletons';

const LABEL_COLORS: Record<string, string> = {
  Inbox: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
  STARRED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  IMPORTANT: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export function Inbox() {
  const { user, signInWithGoogle } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setNeedsReconnect(false);
    try {
      const { messages } = await fetchInbox(q || undefined, 20);
      setEmails(messages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load inbox';
      setError(msg);
      if (msg.includes('not connected') || msg.includes('Gmail') || msg.includes('re-authorize') || msg.includes('access not granted')) {
        setNeedsReconnect(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [q]);

  const handleRefresh = () => load(true);

  const handleReconnect = async () => {
    setReconnecting(true);
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setError(oauthError);
      setReconnecting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = emails;
    if (filter === 'unread') list = list.filter((e) => !e.read);
    if (filter === 'important') list = list.filter((e) => e.important);
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter(
        (e) =>
          e.sender.toLowerCase().includes(term) ||
          e.subject.toLowerCase().includes(term) ||
          e.preview.toLowerCase().includes(term) ||
          e.body.toLowerCase().includes(term)
      );
    }
    return list;
  }, [emails, filter, q]);

  const openEmail = (id: string) => {
    setParams({ email: id });
  };

  if (needsReconnect && !loading) {
    return (
      <div>
        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold text-white">Inbox</h1>
          <p className="text-sm text-ink-400">Connect your Gmail to get started.</p>
        </div>
        <div className="card p-10 text-center max-w-md mx-auto">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10">
            <Mail size={24} className="text-brand-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-white">Gmail not connected</p>
          <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
            Sign in with Google to grant this app access to your inbox.
            We only request read and send permissions — nothing else.
          </p>
          <button
            onClick={handleReconnect}
            disabled={reconnecting}
            className="btn-primary mt-5 w-full"
          >
            {reconnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}
            Connect Gmail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Inbox</h1>
          <p className="text-sm text-ink-400">
            {emails.filter((e) => !e.read).length} unread · {emails.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-outline text-xs px-3 py-2"
            title="Refresh inbox"
          >
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <Filter size={15} className="text-ink-500" />
          {(['all', 'unread', 'important'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip capitalize ${
                filter === f
                  ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
                  : 'border-ink-700 text-ink-400 hover:text-ink-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && !loading && !needsReconnect && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-3 text-xs text-rose-200">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button onClick={handleRefresh} className="mt-1 text-rose-300 underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <InboxSkeleton count={5} />
      ) : error && !needsReconnect && filtered.length === 0 ? null : filtered.length === 0 ? (
        <EmptyState query={q} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((email) => (
            <button
              key={email.id}
              onClick={() => openEmail(email.id)}
              className={`card w-full p-4 text-left transition-all hover:border-brand-500/40 hover:shadow-glow group ${
                !email.read ? 'border-l-2 border-l-brand-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-ink-800 text-sm font-semibold text-ink-200">
                    {initials(email.sender)}
                  </div>
                  {!email.read && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-ink-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm ${
                        !email.read ? 'font-semibold text-white' : 'font-medium text-ink-200'
                      }`}
                    >
                      {email.sender}
                    </p>
                    <span className="shrink-0 text-xs text-ink-500">
                      {formatTime(email.date)}
                    </span>
                  </div>
                  <p
                    className={`truncate text-sm mt-0.5 ${
                      !email.read ? 'text-ink-100' : 'text-ink-400'
                    }`}
                  >
                    {email.subject}
                  </p>
                  <p className="truncate text-xs text-ink-500 mt-1">{email.preview}</p>

                  <div className="mt-2 flex items-center gap-2">
                    {email.label && (
                      <span
                        className={`chip border ${
                          LABEL_COLORS[email.label] ?? 'border-ink-700 text-ink-300'
                        }`}
                      >
                        {email.label}
                      </span>
                    )}
                    {email.important && (
                      <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                        <Star size={11} className="fill-amber-300" /> Important
                      </span>
                    )}
                    {email.read ? (
                      <MailOpen size={13} className="text-ink-600" />
                    ) : (
                      <Circle size={10} className="text-brand-400 fill-brand-400" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-800">
        <MailOpen size={24} className="text-ink-500" />
      </div>
      <p className="mt-4 text-sm font-medium text-ink-200">
        {query ? `No emails match "${query}"` : 'No emails to show'}
      </p>
      <p className="text-xs text-ink-500 mt-1">
        {query ? 'Try a different search term.' : 'Your inbox is empty for now.'}
      </p>
    </div>
  );
}

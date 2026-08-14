import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, RotateCcw, History as HistoryIcon, Loader2 } from 'lucide-react';
import { listHistory, deleteHistory } from '@/lib/history';
import type { HistoryEntry } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { relativeTime } from '@/lib/format';
import { useToast } from '@/components/Toast';

export function History() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    listHistory(user.id)
      .then(setItems)
      .catch(() => notify('Could not load history', 'error'))
      .finally(() => setLoading(false));
  }, [user, notify]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const term = query.toLowerCase();
    return items.filter(
      (i) =>
        i.original_sender.toLowerCase().includes(term) ||
        i.original_subject.toLowerCase().includes(term) ||
        i.generated_reply.toLowerCase().includes(term)
    );
  }, [items, query]);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      notify('Entry deleted', 'success');
    } catch {
      notify('Delete failed', 'error');
    }
  };

  const handleReuse = (entry: HistoryEntry) => {
    navigator.clipboard.writeText(entry.generated_reply);
    notify('Reply copied — paste it into a new email', 'success');
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold text-white">History</h1>
        <p className="text-sm text-ink-400">Every AI-generated reply you have saved.</p>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history by sender, subject, or content…"
          className="input pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading history…
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <HistoryIcon size={26} className="mx-auto text-ink-500" />
          <p className="mt-3 text-sm font-medium text-ink-200">No history yet</p>
          <p className="text-xs text-ink-500 mt-1">
            Generated replies you save or send will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="card p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">
                      {entry.original_subject}
                    </p>
                    <span className="chip border-brand-500/30 bg-brand-500/10 text-brand-300">
                      {entry.tone}
                    </span>
                    <span
                      className={`chip ${
                        entry.status === 'sent'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-ink-700 text-ink-400'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-1">
                    From {entry.original_sender} · {relativeTime(entry.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleReuse(entry)}
                    className="btn-ghost text-xs px-2.5 py-1.5"
                    title="Reuse reply"
                  >
                    <RotateCcw size={14} /> Reuse
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="btn-ghost text-xs px-2.5 py-1.5 hover:text-rose-300"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-ink-850/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-1">
                    Original
                  </p>
                  <p className="text-xs text-ink-300 line-clamp-4">{entry.original_body}</p>
                </div>
                <div className="rounded-lg bg-brand-500/5 border border-brand-500/15 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-400 mb-1">
                    Generated reply
                  </p>
                  <p className="text-xs text-ink-200 line-clamp-4">{entry.generated_reply}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

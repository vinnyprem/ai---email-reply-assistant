import { useEffect, useMemo, useState } from 'react';
import { Send as SendIcon, Loader2 } from 'lucide-react';
import { listHistory } from '@/lib/history';
import type { HistoryEntry } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { relativeTime } from '@/lib/format';

export function Sent() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listHistory(user.id)
      .then((all) => setItems(all.filter((i) => i.status === 'sent')))
      .finally(() => setLoading(false));
  }, [user]);

  const sent = useMemo(() => items, [items]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold text-white">Sent Replies</h1>
        <p className="text-sm text-ink-400">Replies you have sent through Gmail.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : sent.length === 0 ? (
        <div className="card p-12 text-center">
          <SendIcon size={26} className="mx-auto text-ink-500" />
          <p className="mt-3 text-sm font-medium text-ink-200">Nothing sent yet</p>
          <p className="text-xs text-ink-500 mt-1">
            Open an email and hit Send — sent replies show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sent.map((entry) => (
            <div key={entry.id} className="card p-5 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {entry.original_subject}
                  </p>
                  <p className="text-xs text-ink-500 mt-1">
                    Reply to {entry.original_sender} · {relativeTime(entry.created_at)}
                  </p>
                </div>
                <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  <SendIcon size={11} /> Sent
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-brand-500/5 border border-brand-500/15 p-3">
                <p className="text-xs text-ink-200 line-clamp-4">{entry.generated_reply}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  Send,
  Sparkles,
  TrendingUp,
  Mail,
  Clock,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { listHistory } from '@/lib/history';
import type { HistoryEntry } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { relativeTime } from '@/lib/format';

export function Stats() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listHistory(user.id)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const total = items.length;
    const sent = items.filter((i) => i.status === 'sent');
    const sentToday = sent.filter(
      (i) => new Date(i.created_at).toDateString() === new Date().toDateString()
    ).length;
    const drafts = items.filter((i) => i.status === 'draft').length;

    const toneCounts = items.reduce<Record<string, number>>((acc, i) => {
      acc[i.tone] = (acc[i.tone] ?? 0) + 1;
      return acc;
    }, {});
    const mostUsedTone = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    const withTime = items.filter((i) => i.response_time_ms != null);
    const avgResponseMs =
      withTime.length > 0
        ? withTime.reduce((s, i) => s + (i.response_time_ms ?? 0), 0) / withTime.length
        : null;

    const days: { label: string; count: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      const count = items.filter(
        (i) => new Date(i.created_at).toDateString() === date.toDateString()
      ).length;
      days.push({ label, count });
    }

    return {
      total,
      sentCount: sent.length,
      sentToday,
      drafts,
      mostUsedTone,
      avgResponseMs,
      toneCounts,
      days,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading statistics…
      </div>
    );
  }

  const recent = items.slice(0, 5);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold text-white">Statistics</h1>
        <p className="text-sm text-ink-400">Your AI email activity at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Sparkles} label="Replies generated" value={stats.total} accent="brand" />
        <StatCard icon={Send} label="Sent today" value={stats.sentToday} accent="emerald" />
        <StatCard icon={Mail} label="Drafts saved" value={stats.drafts} accent="amber" />
        <StatCard icon={TrendingUp} label="Most used tone" value={stats.mostUsedTone} accent="violet" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Send} label="Total sent" value={stats.sentCount} accent="emerald" />
        <StatCard
          icon={Clock}
          label="Avg response time"
          value={stats.avgResponseMs ? `${(stats.avgResponseMs / 1000).toFixed(1)}s` : '—'}
          accent="brand"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-ink-500" />
            <h2 className="text-sm font-semibold text-white">Activity (last 7 days)</h2>
          </div>
          <BarChart data={stats.days} />
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-ink-500" />
            <h2 className="text-sm font-semibold text-white">Tone distribution</h2>
          </div>
          {Object.keys(stats.toneCounts).length === 0 ? (
            <p className="text-sm text-ink-500 py-8 text-center">No data yet</p>
          ) : (
            <ToneChart counts={stats.toneCounts} />
          )}
        </div>
      </div>

      <div className="mt-6 card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-ink-500" />
          <h2 className="text-sm font-semibold text-white">Recent activity</h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-500 py-6 text-center">
            No activity yet. Generate a reply to see it here.
          </p>
        ) : (
          <ul className="divide-y divide-ink-800">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.original_subject}</p>
                  <p className="text-xs text-ink-500">
                    Reply to {r.original_sender} · {r.tone} tone
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`chip ${
                      r.status === 'sent'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-ink-700 text-ink-400'
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-ink-500">{relativeTime(r.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: 'brand' | 'emerald' | 'amber' | 'violet';
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-500/15 text-brand-300',
    emerald: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
    violet: 'bg-violet-500/15 text-violet-300',
  };
  return (
    <div className="card p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${colors[accent]}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
      <p className="text-xs text-ink-400 mt-0.5">{label}</p>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
              title={`${d.count} replies`}
            />
          </div>
          <span className="text-[11px] text-ink-500">{d.label}</span>
          <span className="text-[10px] text-ink-600">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

const TONE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

function ToneChart({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
  let offset = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width="150" height="150" viewBox="0 0 150 150" className="shrink-0">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="#1e293b" strokeWidth="16" />
        {entries.map(([tone, count], i) => {
          const fraction = count / total;
          const dash = fraction * circumference;
          const seg = (
            <circle
              key={tone}
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke={TONE_COLORS[i % TONE_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 75 75)"
            />
          );
          offset += dash;
          return seg;
        })}
        <text x="75" y="80" textAnchor="middle" className="fill-white text-lg font-semibold">
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {entries.map(([tone, count], i) => (
          <div key={tone} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: TONE_COLORS[i % TONE_COLORS.length] }}
            />
            <span className="text-ink-300">{tone}</span>
            <span className="text-ink-500 ml-auto">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Mail, Calendar, ShieldCheck, LogOut, CheckCircle2, XCircle, Loader2, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { initials } from '@/lib/format';
import { getProfile } from '@/lib/profile';
import { getGmailStatus } from '@/lib/gmail';
import type { Profile } from '@/lib/types';

export function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getProfile(user.id), getGmailStatus()])
      .then(([p, g]) => {
        setProfile(p);
        setGmailConnected(g.connected);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const name =
    (user?.user_metadata?.full_name as string) ||
    profile?.full_name ||
    user?.email?.split('@')[0] ||
    'User';
  const email = user?.email ?? '';
  const avatar = (user?.user_metadata?.avatar_url as string) || profile?.avatar_url || '';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';
  const provider = (user?.app_metadata?.provider as string) || profile?.provider || 'email';
  const accountStatus = profile?.account_status ?? 'active';

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold text-white">Profile</h1>
        <p className="text-sm text-ink-400">Your account details.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt={name} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-ink-700" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-600 text-2xl font-semibold text-white">
              {initials(name)}
            </div>
          )}
          <div>
            <p className="font-display text-xl font-semibold text-white">{name}</p>
            <p className="text-sm text-ink-400">{email}</p>
            <span className="chip mt-2 border-brand-500/30 bg-brand-500/10 text-brand-300 capitalize">
              <ShieldCheck size={12} /> {provider} Account
            </span>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-ink-400">
            <Loader2 size={16} className="animate-spin" /> Loading account info…
          </div>
        ) : (
          <div className="mt-6 divide-y divide-ink-800">
            <Row icon={Mail} label="Email" value={email} />
            <Row icon={Calendar} label="Member since" value={createdAt} />
            <Row icon={ShieldCheck} label="Auth provider" value={provider === 'google' ? 'Google OAuth 2.0' : 'Email & password'} />
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3 text-ink-400">
                <CheckCircle2 size={16} className="text-ink-500" />
                <span className="text-sm">Account status</span>
              </div>
              <span
                className={`chip ${
                  accountStatus === 'active'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {accountStatus === 'active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {accountStatus}
              </span>
            </div>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3 text-ink-400">
                <Mail size={16} className="text-ink-500" />
                <span className="text-sm">Gmail connection</span>
              </div>
              <span
                className={`chip ${
                  gmailConnected
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}
              >
                {gmailConnected ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {gmailConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={async () => {
          await signOut();
          navigate('/');
        }}
        className="btn-outline mt-5 hover:text-rose-300 hover:border-rose-500/30"
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3 text-ink-400">
        <Icon size={16} className="text-ink-500" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LogoWithText } from '@/components/Logo';

export function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/app/inbox');
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    const { error } = await signInWithGoogle();
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-700/20 blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16">
          <LogoWithText size={44} />

          <div className="max-w-md py-12">
            <span className="chip border-brand-500/30 bg-brand-500/10 text-brand-300 mb-6">
              <Zap size={13} /> AI-Powered Inbox
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.1] tracking-tight">
              Reply to any email in seconds, with AI.
            </h1>
            <p className="mt-5 text-base text-ink-300 leading-relaxed">
              AI Email Reply Assistant reads your inbox, understands intent and tone,
              and drafts a polished reply you can edit and send — without leaving the app.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: Mail, title: 'Connect your Gmail', desc: 'Secure Google sign-in brings your inbox right in.' },
                { icon: Zap, title: 'Generate smart replies', desc: 'Pick a tone — professional, friendly, formal — and AI drafts it.' },
                { icon: Shield, title: 'You stay in control', desc: 'Edit, improve, shorten, then send through Gmail.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-800/70 border border-ink-700">
                    <Icon size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-sm text-ink-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-500">
            Built for students, professionals, recruiters & support teams.
          </p>
        </div>

        <div className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md card p-7 md:p-9 animate-scale-in">
            <h2 className="font-display text-2xl font-semibold">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1.5 text-sm text-ink-400">
              {mode === 'signin'
                ? 'Sign in to access your AI inbox.'
                : 'Start generating AI email replies today.'}
            </p>

            <button
              onClick={handleGoogle}
              disabled={busy}
              className="btn-outline w-full mt-6 bg-white text-ink-900 border-transparent hover:bg-ink-100 hover:border-transparent"
            >
              {busy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-ink-500">
              <div className="h-px flex-1 bg-ink-800" />
              or use email
              <div className="h-px flex-1 bg-ink-800" />
            </div>

            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-400">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="font-semibold text-brand-400 hover:text-brand-300"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

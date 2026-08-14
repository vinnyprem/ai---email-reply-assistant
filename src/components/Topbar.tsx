import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { initials } from '@/lib/format';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(`/app/inbox${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    }, 300);
    return () => clearTimeout(t);
  }, [query, navigate]);
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-800 bg-ink-950/80 px-4 py-3 backdrop-blur-md md:px-6">
      <button
        onClick={onMenu}
        className="grid place-items-center rounded-lg p-2 text-ink-300 hover:bg-ink-800 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-xl">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emails by sender, subject, or keyword…"
          className="input pl-10"
        />
      </div>

      <button className="relative grid place-items-center rounded-lg p-2 text-ink-300 hover:bg-ink-800 transition">
        <Bell size={20} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-ink-950" />
      </button>

      <div className="flex items-center gap-2.5 pl-1">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-ink-700"
          />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white ring-2 ring-ink-700">
            {initials(name)}
          </div>
        )}
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-medium text-white max-w-[160px] truncate">{name}</p>
          <p className="text-[11px] text-ink-500">Google Account</p>
        </div>
      </div>
    </header>
  );
}

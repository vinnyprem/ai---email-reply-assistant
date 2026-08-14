import { NavLink, useNavigate } from 'react-router-dom';
import {
  Inbox,
  Send,
  History,
  Settings,
  User,
  LogOut,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LogoWithText } from './Logo';

const NAV = [
  { to: '/app/inbox', label: 'Inbox', icon: Inbox },
  { to: '/app/sent', label: 'Sent Replies', icon: Send },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/stats', label: 'Statistics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="flex h-full w-full flex-col bg-ink-950 border-r border-ink-800">
      <div className="px-5 py-5 border-b border-ink-800">
        <LogoWithText size={38} />
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <Sparkles size={16} className="text-brand-400" />
          <span className="text-xs font-medium text-brand-300">AI Assistant Active</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/15 text-brand-300 border border-brand-500/25'
                  : 'text-ink-300 hover:bg-ink-800/60 hover:text-white border border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-ink-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-rose-500/10 hover:text-rose-300 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
        {user && (
          <div className="mt-3 px-3 py-2 text-[11px] text-ink-500 truncate">
            Signed in as {user.email}
          </div>
        )}
      </div>
    </aside>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { BrandMark } from '@/components/shared/BrandMark';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutList,
  Megaphone,
  Bell,
  User as UserIcon,
  Activity,
  Shield,
  LogOut,
  X,
} from 'lucide-react';

const ROLE_COLOR: Record<string, string> = {
  ADMIN:    '#8018de',
  FOUNDER:  '#6a0fc0',
  FRONTEND: '#0a6dd8',
  BACKEND:  '#1e8f4e',
  DEVOPS:   '#f15d24',
  AI_ML:    '#c79000',
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', FOUNDER: 'Founder', FRONTEND: 'Frontend', BACKEND: 'Backend', DEVOPS: 'DevOps', AI_ML: 'AI / ML',
};

const initialsOf = (name?: string) =>
  (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const PRIMARY = [
  { to: '/feed',          icon: LayoutList, label: 'The Loop', matchExtra: '/' },
  { to: '/campaigns',     icon: Megaphone,  label: 'Campaigns' },
  { to: '/notifications', icon: Bell,       label: 'Notifications' },
  { to: '/profile',       icon: UserIcon,   label: 'My Profile' },
] as const;

const ADMIN_NAV = [
  { to: '/admin/loop-health', icon: Activity, label: 'Loop Health' },
  { to: '/admin/roles',       icon: Shield,   label: 'Role Management' },
] as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{
  to: string;
  icon: LucideIcon;
  label: string;
  onClose: () => void;
  end?: boolean;
  right?: React.ReactNode;
}> = ({ to, icon: Icon, label, onClose, end, right }) => (
  <NavLink
    to={to}
    onClick={onClose}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14.5px] transition-colors ${
        isActive
          ? 'font-semibold'
          : 'font-medium text-ink-muted hover:text-ink hover:bg-brand-softer/60'
      }`
    }
    style={({ isActive }: any) => (isActive ? { background: '#f3ecfd', color: '#8018de' } : undefined)}
  >
    <span className="w-[19px] h-[19px] shrink-0"><Icon size={19} /></span>
    <span className="flex-1 text-left">{label}</span>
    {right}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'FOUNDER' || user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-[244px] bg-white border-r border-surface-border
        flex flex-col shrink-0 sticky top-0 h-screen
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition-transform duration-300
      `}
    >
      {/* Header */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-surface-borderSoft">
        <BrandMark size={34} color="#8018de" />
        <span className="font-heading text-[19px] font-bold text-ink leading-none">
          athwart<span className="text-ink-faint font-normal"> loop</span>
        </span>
        <button
          onClick={onClose}
          className="md:hidden ml-auto text-ink-whisper hover:text-ink p-1"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {PRIMARY.map(({ to, icon, label }) => (
          <NavItem
            key={to}
            to={to}
            icon={icon}
            label={label}
            onClose={onClose}
            end={to === '/feed'}
            right={
              to === '/notifications' && unreadCount > 0 ? (
                <span
                  className="min-w-[18px] h-[18px] px-1.5 rounded-full grid place-items-center text-white text-[11px] font-bold"
                  style={{ background: '#f15d24' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null
            }
          />
        ))}

        {isAdmin && (
          <>
            <div className="text-[11px] uppercase tracking-[0.07em] text-ink-whisper font-semibold pt-4 pb-1.5 px-3">
              Admin
            </div>
            {ADMIN_NAV.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} onClose={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-3 border-t border-surface-borderSoft">
          <div className="flex items-center gap-2.5 p-2">
            <span
              className="w-9 h-9 rounded-full grid place-items-center text-white text-[14px] font-bold shrink-0"
              style={{ background: ROLE_COLOR[user.role] ?? '#8018de' }}
            >
              {initialsOf(user.name)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-ink truncate">{user.name}</div>
              <div className="text-[12px] text-ink-faint truncate">{ROLE_LABEL[user.role] ?? user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-ink-whisper hover:text-[#f15d24] transition-colors p-1.5"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

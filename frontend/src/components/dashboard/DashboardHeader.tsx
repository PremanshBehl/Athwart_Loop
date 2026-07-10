import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, User, Eye, CheckCircle2, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { usePostStore } from '@/stores/post.store';
import { useNotificationStore } from '@/stores/notification.store';

const StatCard: React.FC<{
  Icon: any;
  label: string;
  value: number;
}> = ({ Icon, label, value }) => (
  <Link
    to="/feed"
    className="card p-5 flex items-center gap-4 hover:border-brand-primary/40 transition-colors"
  >
    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-light text-brand-primary">
      <Icon size={18} strokeWidth={1.75} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 font-heading leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  </Link>
);

// Compact dashboard header: welcome banner + at-a-glance stats + unread-
// notifications nudge. Designed to sit *above* the board on /feed so the
// landing page shows "who you are + what needs you + what's on the board"
// in a single scroll.
const DashboardHeader: React.FC = () => {
  const { user } = useAuthStore();
  const { stats, fetchStats } = usePostStore();
  const { unreadCount } = useNotificationStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card p-8 bg-brand-primary text-white border-0 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-light mb-2 font-semibold">
            Welcome back
          </p>
          <h2 className="text-3xl font-bold mb-1 font-heading">
            {user?.name ?? 'Team member'}
          </h2>
          <p className="text-sm text-brand-light font-medium">
            {user?.role?.replace('_', '/')} · {user?.email}
          </p>
        </div>
        <div className="absolute -right-10 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard Icon={Inbox}        label="Open posts"           value={stats.totalActive} />
        <StatCard Icon={User}         label="Need my answer"       value={stats.myActiveTasks} />
        <StatCard Icon={Eye}          label="Need a first response" value={stats.needReview} />
        <StatCard Icon={CheckCircle2} label="I resolved"           value={stats.completed} />
      </div>

      {/* Unread notifications nudge — only when there's something to see. */}
      {unreadCount > 0 && (
        <Link
          to="/notifications"
          className="card p-4 flex items-center gap-3 bg-brand-light/50 border-brand-primary/20 hover:bg-brand-light transition-colors"
        >
          <Bell size={20} className="text-brand-primary" />
          <div>
            <p className="text-sm font-semibold text-brand-primary">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-brand-primary/80 font-medium">
              Click to review them &rarr;
            </p>
          </div>
        </Link>
      )}
    </div>
  );
};

export default DashboardHeader;

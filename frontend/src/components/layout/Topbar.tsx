import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Plus, Search, Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification.store';
import CreatePostModal from '@/components/posts/CreatePostModal';
import api from '@/api/axios';

interface TopbarProps {
  onMenuClick?: () => void;
}

// Small badge that pings the /health endpoint every 30s so the user can tell
// at a glance whether the API is reachable. Also updates optimistically when
// any request in-flight fails.
const useBackendStatus = () => {
  const [up, setUp] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        await api.get('/health');
        if (!cancelled) setUp(true);
      } catch {
        if (!cancelled) setUp(false);
      }
    };
    ping();
    const i = setInterval(ping, 30_000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);
  return up;
};

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const backendUp = useBackendStatus();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  // Push search into the URL so FeedPage picks it up (debounced there).
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (search) next.set('q', search); else next.delete('q');
      setSearchParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <>
      <header
        className="h-16 bg-white sticky top-0 z-20 flex items-center gap-4 px-7"
        style={{ borderBottom: '1px solid #eae5f2' }}
      >
        <button
          onClick={onMenuClick}
          className="md:hidden text-ink-muted hover:text-ink"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 max-w-[460px] relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-whisper">
            <Search size={17} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the loop…"
            className="w-full py-2.5 pl-10 pr-3 text-[14px] rounded-[10px] focus:outline-none"
            style={{ background: '#f8f6fc', border: '1.5px solid #e8e3f0' }}
          />
        </div>

        <div className="flex-1" />

        {/* Backend availability chip */}
        <div
          title={backendUp ? 'API reachable' : 'API not responding'}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[12.5px] font-semibold"
          style={{
            border: `1.5px solid ${backendUp ? '#bfe8cd' : '#f9c3ad'}`,
            background: backendUp ? '#e9f8ef' : '#fdece4',
            color:      backendUp ? '#1e8f4e' : '#f15d24',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: backendUp ? '#1e8f4e' : '#f15d24' }}
          />
          {backendUp ? 'API online' : 'API offline'}
        </div>

        <button
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-[10px] grid place-items-center text-ink-muted transition-colors hover:border-brand-primary"
          style={{ background: '#f8f6fc', border: '1.5px solid #e8e3f0' }}
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full grid place-items-center text-white text-[10px] font-bold"
              style={{ background: '#f15d24' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          id="create-post-btn"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-white text-[14px] font-semibold transition-colors"
          style={{ background: '#8018de' }}
        >
          <Plus size={16} />
          <span className="hidden md:inline">New post</span>
        </button>
      </header>

      <CreatePostModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default Topbar;

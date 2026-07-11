import React, { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AtSign, UserPlus, MessageSquare, Flag, Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification.store';
import { relativeTime } from '@/lib/loopMeta';

const TYPE_META: Record<string, { Icon: LucideIcon; bg: string; color: string }> = {
  MENTION:       { Icon: AtSign,        bg: '#ede3ff', color: '#8018de' },
  ASSIGNMENT:    { Icon: UserPlus,      bg: '#e7f0fc', color: '#0a6dd8' },
  COMMENT_REPLY: { Icon: MessageSquare, bg: '#e9f8ef', color: '#1e8f4e' },
  POST_UPDATE:   { Icon: Flag,          bg: '#fff6df', color: '#c79000' },
};

const NotificationsPage: React.FC = () => {
  const { list, fetch, markRead, markAllRead } = useNotificationStore();
  const unread = list.filter((n) => !n.read).length;

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="al-view max-w-[720px]">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-[30px] text-ink">Notifications</h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="bg-none border-none font-semibold text-[14px]" style={{ color: '#8018de' }}>
            Mark all read
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-[14px] p-[54px] text-center" style={{ border: '1px dashed #d9d2e6' }}>
          <span className="inline-grid place-items-center w-12 h-12 rounded-full mb-3" style={{ background: '#ede3ff', color: '#8018de' }}>
            <Bell size={22} />
          </span>
          <h3 className="font-heading text-[20px] text-ink mb-1.5">Nothing to catch up on</h3>
          <p className="text-ink-faint m-0">When someone mentions you, replies, or updates one of your posts, it lands here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((n) => {
            const meta = TYPE_META[n.type] ?? { Icon: Bell, bg: '#eee', color: '#737373' };
            const Icon = meta.Icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className="rounded-xl px-4 py-3.5 flex gap-3 items-center cursor-pointer transition-colors"
                style={{ background: n.read ? '#fff' : '#faf7ff', border: '1px solid #eae5f2' }}
              >
                <span className="w-[34px] h-[34px] rounded-full grid place-items-center shrink-0" style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-[14px] text-ink-soft leading-[1.4]">{n.message}</p>
                  <span className="text-[12px] text-ink-whisper">{relativeTime(n.createdAt)}</span>
                </div>
                {!n.read && <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: '#8018de' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

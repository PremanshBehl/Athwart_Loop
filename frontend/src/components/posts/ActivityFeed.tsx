import React, { useEffect, useState } from 'react';
import api from '@/api/axios';
import type { LucideIcon } from 'lucide-react';
import { Plus, MessageSquare, Check, ArrowLeft, UserPlus, FolderInput, BookOpen } from 'lucide-react';
import { relativeTime } from '@/lib/loopMeta';

interface AuditRow {
  id: string;
  actionType: string;
  metadata?: any;
  createdAt: string;
  actor?: { id: number; name: string; role: string } | null;
}

// action → human phrase + timeline icon + color, transcribed from the mock.
const ACTION: Record<string, { text: string; Icon: LucideIcon; bg: string; color: string }> = {
  POST_CREATED:       { text: 'created this post',                 Icon: Plus,          bg: '#ede3ff', color: '#8018de' },
  POST_ACKNOWLEDGED:  { text: 'acknowledged & started discussing', Icon: MessageSquare, bg: '#e7f0fc', color: '#0a6dd8' },
  STATUS_CHANGED:     { text: 'moved this forward',                Icon: MessageSquare, bg: '#e7f0fc', color: '#0a6dd8' },
  POST_RESOLVED:      { text: 'resolved this post',                Icon: Check,         bg: '#e9f8ef', color: '#1e8f4e' },
  POST_REOPENED:      { text: 'reopened this post',                Icon: ArrowLeft,     bg: '#fdece4', color: '#f15d24' },
  ASSIGNED:           { text: 'changed the assignee',              Icon: UserPlus,      bg: '#fdece4', color: '#f15d24' },
  UNASSIGNED:         { text: 'cleared the assignee',              Icon: UserPlus,      bg: '#fdece4', color: '#f15d24' },
  DEPARTMENT_CHANGED: { text: 'moved this to another department',  Icon: FolderInput,   bg: '#fdece4', color: '#f15d24' },
  KB_SWEPT:           { text: 'swept this into the knowledge base', Icon: BookOpen,     bg: '#ede3ff', color: '#8018de' },
};

const ActivityFeed: React.FC<{ postId: number; refreshKey?: number }> = ({ postId, refreshKey }) => {
  const [rows, setRows] = useState<AuditRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get(`/posts/${postId}/audit`)
      .then((res) => { if (!cancelled) setRows(res.data ?? []); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, [postId, refreshKey]);

  return (
    <div className="bg-white rounded-2xl p-[18px]" style={{ border: '1px solid #eae5f2' }}>
      <div className="text-[12px] uppercase tracking-[0.06em] text-ink-whisper font-semibold mb-3.5">
        Activity
      </div>

      {rows === null && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="al-skel" style={{ height: 34 }} />)}
        </div>
      )}

      {rows && rows.length === 0 && (
        <p className="text-[13px] text-ink-whisper m-0">No activity yet.</p>
      )}

      {rows && rows.length > 0 && (
        <div className="flex flex-col">
          {rows.map((r, i) => {
            const meta = ACTION[r.actionType] ?? {
              text: r.actionType.toLowerCase().replace(/_/g, ' '),
              Icon: MessageSquare, bg: '#eee', color: '#737373',
            };
            const Icon = meta.Icon;
            const last = i === rows.length - 1;
            return (
              <div key={r.id} className="flex gap-2.5">
                <div className="flex flex-col items-center">
                  <span
                    className="w-[26px] h-[26px] rounded-full grid place-items-center shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <Icon size={14} />
                  </span>
                  {!last && <span className="w-0.5 flex-1 min-h-[14px]" style={{ background: '#eee5f7' }} />}
                </div>
                <div className="pb-3.5">
                  <div className="text-[13.5px] text-ink-soft leading-[1.4]">
                    <b className="text-ink">{r.actor ? r.actor.name.split(' ')[0] : 'System'}</b> {meta.text}
                  </div>
                  <div className="text-[12px] text-ink-whisper mt-0.5">{relativeTime(r.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;

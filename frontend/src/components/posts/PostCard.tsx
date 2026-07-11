import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import {
  ArrowUp, MessageSquare, MoreVertical, Edit2, Trash2,
} from 'lucide-react';
import {
  TYPE_META, STATUS_META, SLA_META, SECTION_LABEL,
  ROLE_COLOR, initialsOf, avatarColor, relativeTime,
} from '@/lib/loopMeta';

interface Props {
  post: Post;
  onVote?: (postId: number) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
}

const PostCard: React.FC<Props> = ({ post, onVote, onEdit, onDelete }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = user?.id === post.authorId;
  const isAdmin = user?.role === 'FOUNDER' || user?.role === 'ADMIN';
  const showMenu = isAuthor || isAdmin;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const tm = TYPE_META[post.type] ?? { label: post.type, color: '#737373', bg: '#eee' };
  const sm = STATUS_META[post.status] ?? { label: post.status, color: '#737373', bg: '#eee' };
  const sla = post.workflowMetrics?.slaStatus ? SLA_META[post.workflowMetrics.slaStatus] : null;

  const voted = !!post.hasVoted;
  const voteCount = post.voteCount ?? post._count?.votes ?? 0;
  const commentCount = post.replyCount ?? post._count?.comments ?? post.comments?.length ?? 0;

  const owner = post.owner;
  const ownerName = owner ? owner.name.split(' ')[0] : 'Unassigned';

  const open = () => navigate(`/post/${post.id}`);

  return (
    <div
      onClick={open}
      className="relative bg-white rounded-[14px] p-4 pl-[18px] pr-[18px] flex gap-4 cursor-pointer transition-all group"
      style={{ border: '1px solid #eae5f2' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#d3c4ee';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(128,24,222,0.07)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#eae5f2';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Vote */}
      <button
        onClick={(e) => { e.stopPropagation(); onVote?.(post.id); }}
        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-[10px] h-fit shrink-0 transition-colors"
        style={{
          border: `1.5px solid ${voted ? '#d3c4ee' : '#e8e3f0'}`,
          background: voted ? '#f3ecfd' : '#fff',
          color: voted ? '#8018de' : '#8a8194',
        }}
        aria-label={voted ? 'Remove vote' : 'Vote'}
      >
        <ArrowUp size={15} />
        <span className="text-[14px] font-bold">{voteCount}</span>
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-md" style={{ color: tm.color, background: tm.bg }}>
            {tm.label}
          </span>
          <span
            className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5"
            style={{ color: sm.color, background: sm.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }} />
            {sm.label}
          </span>
          {post.isUseCase && (
            <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md" style={{ color: '#6a0fc0', background: '#ede3ff' }}>
              Use case
            </span>
          )}
          <span className="text-[12px] text-ink-whisper font-heading">{post.postNumber || `#${post.id}`}</span>
        </div>

        <h3 className="font-heading text-[17px] text-ink mb-1 leading-[1.3]">{post.title}</h3>
        <p className="text-ink-faint text-[14px] leading-[1.5] m-0 line-clamp-2">{post.description}</p>

        <div className="flex items-center gap-4 mt-[11px] text-[12.5px]" style={{ color: '#8a8194' }}>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded-full text-white grid place-items-center text-[9px] font-bold"
              style={{ background: owner ? (ROLE_COLOR[owner.role] ?? avatarColor(owner.role, owner.id)) : '#a89fb5' }}
            >
              {owner ? initialsOf(owner.name) : '—'}
            </span>
            {ownerName}
          </span>
          <span>{SECTION_LABEL[post.section] ?? post.section}</span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare size={14} /> {commentCount}
          </span>
          {post.status !== 'RESOLVED' && sla && (
            <span className="font-semibold" style={{ color: sla.color }}>{sla.label}</span>
          )}
          <span className="ml-auto">{relativeTime(post.createdAt)}</span>
        </div>
      </div>

      {/* Author/admin actions — quiet hover menu, absent from the mock but kept
          so board-level edit/delete isn't lost. */}
      {showMenu && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="p-1 rounded-md text-ink-whisper hover:text-ink hover:bg-brand-softer/60"
            aria-label="Post actions"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg z-10 py-1 overflow-hidden" style={{ border: '1px solid #eae5f2' }}>
              {isAuthor && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(post); }}
                  className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-hover"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  if (confirm('Delete this post? This cannot be undone.')) onDelete?.(post.id);
                }}
                className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm hover:bg-[#fdece4]"
                style={{ color: '#f15d24' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePostStore } from '@/stores/post.store';
import { useAuthStore } from '@/stores/auth.store';
import RenderMentionText from '@/components/shared/RenderMentionText';
import CommentThread from '@/components/posts/CommentThread';
import AISummary from '@/components/posts/AISummary';
import SimilarPosts from '@/components/posts/SimilarPosts';
import AttachmentList from '@/components/posts/AttachmentList';
import ActivityFeed from '@/components/posts/ActivityFeed';
import CreatePostModal from '@/components/posts/CreatePostModal';
import ResolveModal from '@/components/posts/ResolveModal';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, Check, Link2, Star, Sparkles, ArrowUp,
} from 'lucide-react';
import {
  TYPE_META, STATUS_META, SLA_META, SECTION_LABEL, RES_LABEL,
  ROLE_LABEL, ROLE_COLOR, initialsOf, avatarColor, relativeTime,
} from '@/lib/loopMeta';

const Avatar: React.FC<{ user?: { name: string; role: string; id: number } | null; size: number; text?: number }> = ({ user, size, text = 10 }) => (
  <span
    className="rounded-full text-white grid place-items-center font-bold shrink-0"
    style={{
      width: size, height: size, fontSize: text,
      background: user ? (ROLE_COLOR[user.role] ?? avatarColor(user.role, user.id)) : '#a89fb5',
    }}
  >
    {user ? initialsOf(user.name) : '—'}
  </span>
);

const PostDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { current: post, loading, postError, fetchPost, updateStatus, deletePost, votePost, updatePost } = usePostStore();
  const [editOpen, setEditOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [auditKey, setAuditKey] = useState(0);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSeed, setDraftSeed] = useState<{
    token: string; text: string;
    sources?: Array<{ postNumber: string | null; title: string; id: number }>;
    confidence?: 'high' | 'low' | 'none';
  } | null>(null);

  useEffect(() => {
    if (id) fetchPost(Number(id));
  }, [id, fetchPost]);

  if (loading) {
    return (
      <div className="al-view max-w-[1080px] mx-auto">
        <div className="al-skel mb-4" style={{ height: 20, width: 160 }} />
        <div className="al-skel" style={{ height: 320 }} />
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="al-view max-w-[1080px] mx-auto">
        <button onClick={() => navigate('/feed')} className="inline-flex items-center gap-1.5 text-ink-faint text-[14px] font-medium mb-4 hover:text-brand-primary">
          <ArrowLeft size={16} /> Back to the loop
        </button>
        <div className="bg-white rounded-2xl p-11 text-center" style={{ border: '1px solid #f9c3ad' }}>
          <div className="text-[34px] mb-2">⚠️</div>
          <h3 className="font-heading text-[20px] text-ink mb-1.5">{postError || 'Post not found'}</h3>
          <button onClick={() => id && fetchPost(Number(id))} className="mt-2 px-5 py-2.5 rounded-[10px] text-white font-semibold" style={{ background: '#8018de' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;
  const isOwner = user?.id === post.ownerId;
  const isAdmin = user?.role === 'FOUNDER' || user?.role === 'ADMIN';
  const canActAsOwner = isOwner || isAdmin;
  const canResolve = canActAsOwner || (post.type === 'QUESTION' && isAuthor);
  const canReopen = canActAsOwner || isAuthor;

  const tm = TYPE_META[post.type] ?? { label: post.type, color: '#737373', bg: '#eee' };
  const sm = STATUS_META[post.status] ?? { label: post.status, color: '#737373', bg: '#eee' };
  const sla = post.workflowMetrics?.slaStatus ? SLA_META[post.workflowMetrics.slaStatus] : null;

  const canonical = post.comments?.find((c) => c.isCanonical);
  const showCanonical = canonical && post.status === 'RESOLVED';
  const threadComments = canonical
    ? (post.comments ?? []).filter((c) => c.id !== canonical.id)
    : (post.comments ?? []);

  const refresh = async () => { await fetchPost(post.id, true); setAuditKey((k) => k + 1); };


  const reopen = async () => {
    try { await updateStatus(post.id, 'OPEN'); await refresh(); toast.success('Reopened'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to reopen'); }
  };
  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    await deletePost(post.id); navigate('/feed');
  };
  const toggleUseCase = async () => {
    try {
      const fd = new FormData();
      fd.append('isUseCase', String(!post.isUseCase));
      await updatePost(post.id, fd); await refresh();
      toast.success(post.isUseCase ? 'Use Case flag removed' : 'Graduated to Use Case');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to update'); }
  };
  const generateDraft = async () => {
    setDraftLoading(true);
    try {
      const res = await api.post(`/intelligence/draft-response/${post.id}`);
      const payload = res.data?.data ?? res.data;
      if (!payload?.draft) toast('No relevant resolved posts found — draft manually.', { icon: '📝' });
      else setDraftSeed({ token: `${post.id}-${Date.now()}`, text: payload.draft, sources: payload.sources ?? [], confidence: payload.confidence });
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to generate draft'); }
    finally { setDraftLoading(false); }
  };

  const canShowResolve = (post.status === 'OPEN' || post.status === 'DISCUSSING') && canResolve;
  const canShowReopen = post.status === 'RESOLVED' && canReopen;
  const noActions = !canShowResolve && !canShowReopen;
  const noActionsReason = post.status === 'OPEN'
    ? 'Waiting for discussion to start.'
    : post.status === 'DISCUSSING' ? 'Waiting on the owner to resolve.' : 'This post is resolved.';

  const owner = post.owner;
  const showManage = isAuthor || isAdmin || isOwner;

  return (
    <div className="al-view max-w-[1080px] mx-auto">
      <button onClick={() => navigate('/feed')} className="inline-flex items-center gap-1.5 bg-none border-none text-ink-faint text-[14px] font-medium mb-4 hover:text-brand-primary transition-colors">
        <ArrowLeft size={16} /> Back to the loop
      </button>

      <div className="grid gap-[22px] items-start" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px' }}>
        {/* Main column */}
        <div className="min-w-0">
          <div className="bg-white rounded-2xl p-[26px]" style={{ border: '1px solid #eae5f2' }}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-md" style={{ color: tm.color, background: tm.bg }}>{tm.label}</span>
              <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5" style={{ color: sm.color, background: sm.bg }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }} />{sm.label}
              </span>
              {post.isUseCase && (
                <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md" style={{ color: '#6a0fc0', background: '#ede3ff' }}>Use case</span>
              )}
              <span className="text-[12.5px] text-ink-whisper font-heading ml-auto">{post.postNumber}</span>
            </div>

            <h1 className="font-heading text-[27px] text-ink leading-[1.25] mb-3.5">{post.title}</h1>

            <div className="flex items-center gap-3.5 text-[13px] text-ink-ghost mb-5 flex-wrap">
              <span className="inline-flex items-center gap-2">
                <Avatar user={post.author} size={24} />
                <b className="text-ink-muted font-semibold">{post.author?.name}</b> · {relativeTime(post.createdAt)}
              </span>
              <span>{SECTION_LABEL[post.section] ?? post.section}</span>
            </div>

            <div className="text-[15.5px] leading-[1.7] text-ink-soft whitespace-pre-wrap">
              <RenderMentionText content={post.description} />
            </div>

            <AttachmentList attachments={post.attachments} />

            {post.status === 'RESOLVED' && (
              <div className="mt-[22px] rounded-xl p-4" style={{ background: '#f0fbf4', border: '1px solid #bfe8cd' }}>
                <div className="flex items-center gap-2 text-[13px] font-bold mb-1.5" style={{ color: '#1e8f4e' }}>
                  <Check size={16} /> Resolved · {post.resolution ? (RES_LABEL[post.resolution] ?? post.resolution) : ''}
                </div>
                {post.resolutionReason && <p className="m-0 mb-2 text-[14px] text-ink-soft leading-[1.55]">{post.resolutionReason}</p>}
                {post.buildIssueUrl && (
                  <a href={post.buildIssueUrl} target="_blank" rel="noreferrer" className="text-[13px] font-semibold inline-flex items-center gap-1.5" style={{ color: '#8018de' }}>
                    <Link2 size={14} /> Tracked build issue
                  </a>
                )}
              </div>
            )}
          </div>

          {showCanonical && canonical && (
            <div className="rounded-2xl p-5 mt-4" style={{ background: '#faf7ff', border: '1.5px solid #d3c4ee' }}>
              <div className="flex items-center gap-2 text-[13px] font-bold mb-2" style={{ color: '#6a0fc0' }}>
                <Star size={16} /> Canonical answer
              </div>
              <p className="m-0 text-[15px] leading-[1.6] text-ink-soft whitespace-pre-wrap">
                <RenderMentionText content={canonical.content} />
              </p>
            </div>
          )}

          <div className="mt-[22px]">
            <AISummary postId={post.id} initialSummary={post.workflowMetrics?.aiSummaryCache} isLocked={post.status === 'RESOLVED'} />
          </div>

          <div className="mt-[22px]"><SimilarPosts postId={post.id} /></div>

          {/* Discussion */}
          <div className="mt-[22px]">
            <div className="flex items-center justify-between mb-3.5 gap-3 flex-wrap">
              <h3 className="font-heading text-[18px] text-ink">
                Discussion <span className="font-sans font-normal text-ink-whisper">· {threadComments.length}</span>
              </h3>
              {canActAsOwner && post.type === 'QUESTION' && post.status !== 'RESOLVED' && (
                <button onClick={generateDraft} disabled={draftLoading}
                  className="text-[12.5px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                  style={{ background: '#faf7ff', color: '#6a0fc0', border: '1.5px solid #d3c4ee' }}>
                  <Sparkles size={14} /> {draftLoading ? 'Drafting…' : 'Generate draft'}
                </button>
              )}
            </div>
            <CommentThread
              comments={threadComments}
              postId={post.id}
              postOwnerId={post.ownerId}
              onRefresh={refresh}
              isLocked={post.status === 'RESOLVED'}
              draftSeed={draftSeed}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 sticky" style={{ top: 84 }}>
          {/* Workflow */}
          <div className="bg-white rounded-2xl p-[18px]" style={{ border: '1px solid #eae5f2' }}>
            <div className="text-[12px] uppercase tracking-[0.06em] text-ink-whisper font-semibold mb-3">Workflow</div>

            {canShowResolve && (
              <button onClick={() => setResolveOpen(true)} className="w-full py-2.5 rounded-[10px] text-white font-semibold text-[14px] mb-2 flex items-center justify-center gap-2" style={{ background: '#2ac25d' }}>
                <Check size={16} /> Resolve
              </button>
            )}
            {canShowReopen && (
              <button onClick={reopen} className="w-full py-2.5 rounded-[10px] font-semibold text-[14px] bg-white" style={{ color: '#f15d24', border: '1.5px solid #f9c3ad' }}>
                Reopen
              </button>
            )}
            {noActions && <p className="m-0 text-[13px] text-ink-whisper leading-[1.5]">{noActionsReason}</p>}

            {showManage && (
              <div className="mt-3 pt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12.5px]" style={{ borderTop: '1px solid #f0ecf7' }}>
                {isAuthor && (
                  <button onClick={() => setEditOpen(true)} className="text-ink-faint hover:text-brand-primary font-medium">Edit</button>
                )}
                {canActAsOwner && (
                  <button onClick={toggleUseCase} className="text-ink-faint hover:text-brand-primary font-medium">
                    {post.isUseCase ? 'Remove use case' : 'Graduate to use case'}
                  </button>
                )}
                {(isAuthor || isAdmin) && (
                  <button onClick={handleDelete} className="font-medium" style={{ color: '#f15d24' }}>Delete</button>
                )}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="bg-white rounded-2xl p-[18px] flex flex-col gap-3.5" style={{ border: '1px solid #eae5f2' }}>
            <div>
              <div className="text-[12px] text-ink-whisper font-semibold mb-1.5">OWNER</div>
              <div className="flex items-center gap-2 text-[14px] text-ink font-medium">
                <Avatar user={owner} size={24} /> {owner ? owner.name : 'Unassigned'}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-ink-whisper font-semibold mb-1.5">ASSIGNEE</div>
              <div className="flex items-center gap-2 text-[14px] text-ink font-medium">
                {post.assignee ? (<><Avatar user={post.assignee} size={24} /> {post.assignee.name}</>) : (<span className="text-ink-ghost">— No assignee</span>)}
              </div>
            </div>
            <div className="flex gap-5">
              <div>
                <div className="text-[12px] text-ink-whisper font-semibold mb-1.5">SLA</div>
                <div className="text-[14px] font-semibold" style={{ color: sla?.color ?? '#737373' }}>{sla?.label ?? '—'}</div>
              </div>
              <div>
                <div className="text-[12px] text-ink-whisper font-semibold mb-1.5">VOTES</div>
                <button
                  onClick={() => votePost(post.id)}
                  className="text-[14px] font-semibold text-ink inline-flex items-center gap-1 hover:text-brand-primary"
                  title={post.hasVoted ? 'Remove your vote' : 'Vote'}
                >
                  <ArrowUp size={14} style={{ color: post.hasVoted ? '#8018de' : undefined }} />
                  {post.voteCount ?? 0}
                </button>
              </div>
            </div>
          </div>

          {/* Activity */}
          <ActivityFeed postId={post.id} refreshKey={auditKey} />
        </div>
      </div>

      <CreatePostModal isOpen={editOpen} onClose={() => { setEditOpen(false); refresh(); }} post={post} />
      <ResolveModal isOpen={resolveOpen} onClose={() => setResolveOpen(false)} postId={post.id} postType={post.type} isUseCase={post.isUseCase} />
    </div>
  );
};

export default PostDetailPage;

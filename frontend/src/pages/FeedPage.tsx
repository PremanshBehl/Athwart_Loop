import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePostStore } from '@/stores/post.store';
import PostCard from '@/components/posts/PostCard';
import CreatePostModal from '@/components/posts/CreatePostModal';
import { Post } from '@/types';
import { SECTIONS, SECTION_LABEL } from '@/lib/loopMeta';
import { BrandMark } from '@/components/shared/BrandMark';

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'DISCUSSING', label: 'Discussing' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const StatCard: React.FC<{ label: string; value: number; dot: string }> = ({ label, value, dot }) => (
  <div className="bg-white rounded-[14px] px-[18px] py-4" style={{ border: '1px solid #eae5f2' }}>
    <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: '#737373' }}>
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
      {label}
    </div>
    <div className="font-heading text-[30px] font-bold text-ink mt-1.5 leading-none">{value}</div>
  </div>
);

const FeedPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    feed, loading, feedError, hasMore, loadingMore,
    fetchFeed, fetchMoreFeed, votePost, deletePost, stats,
  } = usePostStore();

  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [section, setSection] = useState(searchParams.get('section') ?? 'ALL');
  const [needResponse, setNeedResponse] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const search = searchParams.get('q') ?? '';

  // React to sidebar section links / topbar search changing the URL.
  useEffect(() => {
    const urlSection = searchParams.get('section') ?? 'ALL';
    if (urlSection !== section) setSection(urlSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    fetchFeed({
      search: search || undefined,
      type: type === 'ALL' ? undefined : type,
      section: section === 'ALL' ? undefined : section,
      status: status === 'ALL' ? '' : status,
      needResponse: needResponse || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type, section, status, needResponse]);

  const onSectionChange = (v: string) => {
    setSection(v);
    const next = new URLSearchParams(searchParams);
    if (v === 'ALL') next.delete('section'); else next.set('section', v);
    setSearchParams(next, { replace: true });
  };

  const showList = !loading && !feedError && feed.length > 0;
  const boardEmpty = !loading && !feedError && feed.length === 0;

  return (
    <div className="al-view max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-[30px] text-ink">The Loop</h1>
          <p className="text-ink-faint mt-1 text-[15px]">
            {feed.length} post{feed.length === 1 ? '' : 's'} · questions, problems &amp; ideas across the team
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-[22px]">
        <StatCard label="Active"           value={stats.totalActive}   dot="#8018de" />
        <StatCard label="My open tasks"    value={stats.myActiveTasks} dot="#0a6dd8" />
        <StatCard label="Needs response"   value={stats.needReview}    dot="#fec530" />
        <StatCard label="Resolved (mine)"  value={stats.completed}     dot="#2ac25d" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center mb-[18px]">
        {STATUS_PILLS.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
              style={{
                border: `1.5px solid ${active ? '#8018de' : '#e8e3f0'}`,
                background: active ? '#8018de' : '#fff',
                color: active ? '#fff' : '#5a5266',
              }}
            >
              {f.label}
            </button>
          );
        })}

        <span className="w-px h-6 mx-1" style={{ background: '#e2e2e2' }} />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-1.5 rounded-full text-[13px] font-medium text-ink bg-white"
          style={{ border: '1.5px solid #e8e3f0' }}
        >
          <option value="ALL">All types</option>
          <option value="QUESTION">Questions</option>
          <option value="PROBLEM">Problems</option>
          <option value="IDEA">Ideas</option>
        </select>

        <select
          value={section}
          onChange={(e) => onSectionChange(e.target.value)}
          className="px-3 py-1.5 rounded-full text-[13px] font-medium text-ink bg-white"
          style={{ border: '1.5px solid #e8e3f0' }}
        >
          <option value="ALL">All sections</option>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{SECTION_LABEL[s]}</option>
          ))}
        </select>

        <button
          onClick={() => setNeedResponse((v) => !v)}
          className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
          style={{
            border: `1.5px solid ${needResponse ? '#f4d78a' : '#e8e3f0'}`,
            background: needResponse ? '#fff6df' : '#fff',
            color: needResponse ? '#c79000' : '#5a5266',
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full" style={{ background: '#fec530' }} />
          Needs response
        </button>
      </div>

      {/* States */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="al-skel" style={{ height: 92 }} />)}
        </div>
      )}

      {feedError && (
        <div className="bg-white rounded-[14px] p-11 text-center" style={{ border: '1px solid #f9c3ad' }}>
          <div className="text-[34px] mb-2">⚠️</div>
          <h3 className="font-heading text-[20px] text-ink mb-1.5">Couldn't reach the loop</h3>
          <p className="text-ink-faint mb-[18px]">{feedError}</p>
          <button
            onClick={() => fetchFeed()}
            className="px-5 py-2.5 rounded-[10px] text-white font-semibold"
            style={{ background: '#8018de' }}
          >
            Retry
          </button>
        </div>
      )}

      {boardEmpty && (
        <div className="bg-white rounded-[14px] p-[54px] text-center" style={{ border: '1px dashed #d9d2e6' }}>
          <div className="inline-block opacity-50"><BrandMark size={54} color="#8018de" /></div>
          <h3 className="font-heading text-[20px] text-ink mt-3.5 mb-1.5">Nothing here yet</h3>
          <p className="text-ink-faint mb-[18px]">No posts match these filters. Try clearing them, or start a new thread.</p>
          <button
            onClick={() => setComposerOpen(true)}
            className="px-5 py-2.5 rounded-[10px] text-white font-semibold"
            style={{ background: '#8018de' }}
          >
            New post
          </button>
        </div>
      )}

      {showList && (
        <div className="flex flex-col gap-3">
          {feed.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={(id) => votePost(id)}
              onEdit={(p) => setEditingPost(p)}
              onDelete={(id) => deletePost(id)}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchMoreFeed()}
                disabled={loadingMore}
                className="px-8 py-2.5 rounded-[10px] font-semibold bg-white text-ink-muted transition-colors disabled:opacity-50"
                style={{ border: '1.5px solid #e8e3f0' }}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      <CreatePostModal isOpen={composerOpen} onClose={() => setComposerOpen(false)} />
      <CreatePostModal
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        post={editingPost}
      />
    </div>
  );
};

export default FeedPage;

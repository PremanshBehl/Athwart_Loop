import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import { User, Post } from '@/types';
import { ROLE_LABEL, ROLE_COLOR, STATUS_META, initialsOf } from '@/lib/loopMeta';

const ProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, fetchMe } = useAuthStore();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !id || Number(id) === currentUser?.id;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let u: User | null = null;
        if (isOwnProfile) {
          u = currentUser ?? null;
          if (currentUser) setForm({ name: currentUser.name || '', bio: currentUser.bio || '', avatarUrl: currentUser.avatarUrl || '' });
        } else {
          const { data } = await api.get(`/users/${id}`);
          u = data;
        }
        if (cancelled) return;
        setProfileUser(u);

        if (u) {
          // Best-effort authored-posts fetch with graceful fallbacks.
          let list: any[] = [];
          try {
            const res = await api.get('/posts', { params: { authorId: u.id, limit: 50 } });
            list = Array.isArray(res.data) ? res.data : [];
          } catch {
            try {
              const res = await api.get('/posts', { params: { limit: 50 } });
              const all = Array.isArray(res.data) ? res.data : [];
              list = all.filter((p: any) => p.author?.id === u!.id);
            } catch { list = []; }
          }
          if (!cancelled) setPosts(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, currentUser, isOwnProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setSaving(true);
    try {
      await api.patch('/auth/me', form);
      await fetchMe();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="al-view max-w-[820px]">
        <div className="al-skel mb-5" style={{ height: 138 }} />
        <div className="grid grid-cols-3 gap-4"><div className="al-skel" style={{ height: 90 }} /><div className="al-skel" style={{ height: 90 }} /><div className="al-skel" style={{ height: 90 }} /></div>
      </div>
    );
  }
  if (!profileUser) return <div className="text-center text-ink-faint py-16">User not found</div>;

  const authored = posts.length;
  const resolved = posts.filter((p) => p.status === 'RESOLVED').length;
  const open = posts.filter((p) => p.status !== 'RESOLVED').length;
  const cards = [
    { value: authored, label: 'Posts authored' },
    { value: open, label: 'Still open' },
    { value: resolved, label: 'Resolved' },
  ];

  return (
    <div className="al-view max-w-[820px]">
      {/* Hero */}
      <div className="rounded-[18px] p-[30px] text-white flex items-center gap-[22px] mb-[22px] relative" style={{ background: 'linear-gradient(120deg,#8018de,#a24bec)' }}>
        <span
          className="w-[78px] h-[78px] rounded-full grid place-items-center text-[28px] font-bold font-heading shrink-0"
          style={{ background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.5)' }}
        >
          {initialsOf(profileUser.name)}
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-[30px] text-white leading-tight">{profileUser.name}</h1>
          <p className="m-0 mt-1 text-[15px]" style={{ color: '#ede3ff' }}>
            {ROLE_LABEL[profileUser.role] ?? profileUser.role} · {profileUser.email}
          </p>
        </div>
        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto self-start px-3.5 py-2 rounded-[10px] text-[13px] font-semibold text-white"
            style={{ background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)' }}
          >
            Edit profile
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 mb-[22px] flex flex-col gap-3" style={{ border: '1px solid #eae5f2' }}>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3.5 py-2.5 rounded-[10px] text-[15px] focus:outline-none" style={{ border: '1.5px solid #e2e2e2' }} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-[10px] text-[14px] resize-y focus:outline-none" style={{ border: '1.5px solid #e2e2e2' }} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5">Avatar URL <span className="text-ink-whisper font-normal">(optional)</span></label>
            <input type="url" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="w-full px-3.5 py-2.5 rounded-[10px] text-[14px] focus:outline-none" style={{ border: '1.5px solid #e2e2e2' }} />
          </div>
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 rounded-[10px] font-semibold text-[14px] bg-white text-ink-muted" style={{ border: '1.5px solid #e2e2e2' }}>Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-[10px] font-semibold text-[14px] text-white disabled:opacity-60" style={{ background: '#8018de' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}

      {/* Contribution cards */}
      <div className="grid grid-cols-3 gap-4 mb-[22px]">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 text-center" style={{ border: '1px solid #eae5f2' }}>
            <div className="font-heading text-[32px] font-bold" style={{ color: '#8018de' }}>{c.value}</div>
            <div className="text-[13px] text-ink-faint mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Recent posts */}
      <h3 className="font-heading text-[18px] text-ink mb-3.5">Recent posts</h3>
      {posts.length === 0 ? (
        <div className="bg-white rounded-[14px] p-8 text-center text-ink-faint" style={{ border: '1px dashed #d9d2e6' }}>
          No posts yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {[...posts]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12)
            .map((p) => {
              const sm = STATUS_META[p.status] ?? { label: p.status, color: '#737373', bg: '#eee' };
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/post/${p.id}`)}
                  className="bg-white rounded-xl px-4 py-3.5 cursor-pointer flex items-center gap-3 transition-colors hover:border-brand-primary/40"
                  style={{ border: '1px solid #eae5f2' }}
                >
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
                  <span className="flex-1 text-[14.5px] text-ink font-medium truncate">{p.title}</span>
                  <span className="text-[12px] text-ink-whisper font-heading shrink-0">{p.postNumber}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

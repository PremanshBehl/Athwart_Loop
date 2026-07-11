import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import { ROLE_COLOR, initialsOf } from '@/lib/loopMeta';

export interface CampaignRow {
  id: number;
  title: string;
  prompt: string;
  themeTag?: string | null;
  status: 'ACTIVE' | 'CLOSED';
  startsAt: string;
  endsAt: string;
  closedAt?: string | null;
  createdBy: { id: number; name: string; role: string };
  winner?: { id: number; postNumber: string; title: string } | null;
  _count?: { posts: number };
}

const CampaignsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState(false);
  const isAdmin = user?.role === 'FOUNDER' || user?.role === 'ADMIN';

  useEffect(() => {
    api.get('/campaigns')
      .then((res) => setRows((res.data as unknown as CampaignRow[]) ?? []))
      .catch(() => { setRows([]); setError(true); });
  }, []);

  const sorted = rows
    ? [...rows].sort((a, b) => (a.status === b.status ? 0 : a.status === 'ACTIVE' ? -1 : 1))
    : [];

  return (
    <div className="al-view max-w-[860px]">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="font-heading text-[30px] text-ink">Campaigns</h1>
          <p className="text-ink-faint mt-1 m-0 text-[15px]">
            Time-boxed themed prompts. Tag an Idea to enter — the founder picks a winner.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin/campaigns')}
            className="px-4 py-2.5 rounded-[10px] text-white text-[14px] font-semibold shrink-0"
            style={{ background: '#8018de' }}
          >
            New campaign
          </button>
        )}
      </div>

      {rows === null && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => <div key={i} className="al-skel" style={{ height: 160 }} />)}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="bg-white rounded-[14px] p-[54px] text-center" style={{ border: '1px dashed #d9d2e6' }}>
          <h3 className="font-heading text-[20px] text-ink mb-1.5">
            {error ? 'Couldn’t load campaigns' : 'No campaigns yet'}
          </h3>
          <p className="text-ink-faint m-0">
            {error ? 'The backend didn’t respond. Try refreshing.' : 'The founder hasn’t opened a themed ask yet.'}
          </p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="flex flex-col gap-4">
          {sorted.map((c) => {
            const active = c.status === 'ACTIVE';
            const daysLeft = Math.max(0, Math.round((new Date(c.endsAt).getTime() - Date.now()) / (24 * 3600e3)));
            const count = c._count?.posts ?? 0;
            const creator = c.createdBy;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
                style={{ border: '1px solid #eae5f2' }}
              >
                <div className="h-1" style={{ background: active ? '#8018de' : '#c9c1d8' }} />
                <div className="px-[22px] py-5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md" style={{ color: active ? '#1e8f4e' : '#737373', background: active ? '#e9f8ef' : '#f0ecf7' }}>
                      {active ? 'Active' : 'Closed'}
                    </span>
                    {c.themeTag && <span className="text-[13px] font-semibold" style={{ color: '#8018de' }}>#{c.themeTag}</span>}
                    <span className="text-[13px] text-ink-whisper ml-auto">
                      {active ? `${daysLeft} days left` : (c.winner ? `Won · ${c.winner.postNumber}` : 'Closed')}
                    </span>
                  </div>
                  <h3 className="font-heading text-[19px] text-ink mb-1.5">{c.title}</h3>
                  <p className="text-[14.5px] text-ink-soft leading-[1.55] m-0 mb-3.5">{c.prompt}</p>
                  <div className="flex items-center gap-2.5 text-[13px] text-ink-faint">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-[22px] h-[22px] rounded-full text-white grid place-items-center text-[9px] font-bold" style={{ background: ROLE_COLOR[creator.role] ?? '#8018de' }}>
                        {initialsOf(creator.name)}
                      </span>
                      {creator.name}
                    </span>
                    <span style={{ color: '#c9c1d8' }}>·</span>
                    <span>{count} idea{count === 1 ? '' : 's'} tagged</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import { SLA_META, SECTION_LABEL } from '@/lib/loopMeta';

interface LoopHealth {
  openTotal: number;
  needResponseCount: number;
  blackHoleCount: number;
  blackHoleRate: number;
  slaStatusCounts: { HEALTHY: number; AT_RISK: number; BREACHED: number };
  perSection: Array<{ section: string; total: number; open: number; breached: number }>;
  generatedAt: string;
}

const AdminLoopHealthPage: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<LoopHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'FOUNDER';

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    api.get<LoopHealth>('/admin/loop-health')
      .then((res) => { if (!cancelled) setData(res.data as unknown as LoopHealth); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Failed to load Loop health'); });
    return () => { cancelled = true; };
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/feed" replace />;

  return (
    <div className="al-view max-w-[1000px]">
      <h1 className="font-heading text-[30px] text-ink mb-1">Loop Health</h1>
      <p className="text-ink-faint m-0 mb-6 text-[15px]">System-wide flow metrics. Restricted to Admin &amp; Founder.</p>

      {error && (
        <div className="bg-white rounded-2xl p-6 text-[14px]" style={{ border: '1px solid #f9c3ad', color: '#b23c12' }}>{error}</div>
      )}

      {!data && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="al-skel" style={{ height: 110 }} />)}
        </div>
      )}

      {data && (() => {
        const bhRate = Math.round(data.blackHoleRate * 100);
        const breached = data.slaStatusCounts.BREACHED;
        const total = data.slaStatusCounts.HEALTHY + data.slaStatusCounts.AT_RISK + data.slaStatusCounts.BREACHED;
        const cards = [
          { label: 'Open posts', value: String(data.openTotal), sub: 'across all sections', color: '#8018de' },
          { label: 'Black-hole rate', value: `${bhRate}%`, sub: `${data.blackHoleCount} open > 48h unacknowledged`, color: bhRate > 20 ? '#f15d24' : '#c79000' },
          { label: 'Breached SLA', value: String(breached), sub: 'need immediate attention', color: breached ? '#f15d24' : '#1e8f4e' },
        ];
        const maxOpen = Math.max(1, ...data.perSection.map((s) => s.open));
        const sortedSections = [...data.perSection].sort((a, b) => b.open - a.open);

        return (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {cards.map((c) => (
                <div key={c.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #eae5f2' }}>
                  <div className="text-[13px] text-ink-faint font-medium">{c.label}</div>
                  <div className="font-heading text-[34px] font-bold my-2 leading-none" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-[12.5px] text-ink-whisper">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SLA status */}
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #eae5f2' }}>
                <h3 className="font-heading text-[16px] text-ink mb-4">SLA status</h3>
                {(['HEALTHY', 'AT_RISK', 'BREACHED'] as const).map((k) => {
                  const count = data.slaStatusCounts[k];
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={k} className="mb-3.5">
                      <div className="flex justify-between text-[13px] mb-1.5">
                        <span className="text-ink-soft font-medium">{SLA_META[k].label}</span>
                        <span className="text-ink-faint">{count}</span>
                      </div>
                      <div className="h-2 rounded" style={{ background: '#f0ecf7' }}>
                        <div className="h-full rounded" style={{ width: `${pct}%`, background: SLA_META[k].color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Open by section */}
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #eae5f2' }}>
                <h3 className="font-heading text-[16px] text-ink mb-4">Open by section</h3>
                {sortedSections.filter((s) => s.open > 0).length === 0 ? (
                  <p className="text-[13px] text-ink-whisper m-0">No open posts.</p>
                ) : (
                  sortedSections.filter((s) => s.open > 0).map((s) => (
                    <div key={s.section} className="flex items-center gap-2.5 mb-2.5">
                      <span className="w-[90px] text-[13px] text-ink-soft shrink-0">{SECTION_LABEL[s.section] ?? s.section}</span>
                      <div className="flex-1 h-2 rounded" style={{ background: '#f0ecf7' }}>
                        <div className="h-full rounded" style={{ width: `${Math.round((s.open / maxOpen) * 100)}%`, background: '#8018de' }} />
                      </div>
                      <span className="text-[13px] text-ink-faint w-6 text-right">{s.open}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default AdminLoopHealthPage;

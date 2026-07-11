import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { SECTION_LABEL, ROLE_LABEL, ROLE_COLOR, initialsOf } from '@/lib/loopMeta';

interface OwnerRow {
  section: string;
  owner: { id: number; name: string; role: string; avatarUrl?: string | null } | null;
}

const AdminSectionOwnersPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'FOUNDER';

  const [rows, setRows] = useState<OwnerRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      api.get('/admin/section-owners'),
      api.get('/auth/users', { params: { limit: 200 } }),
    ])
      .then(([ownersRes, usersRes]) => {
        setRows((ownersRes.data as any) as OwnerRow[]);
        setUsers(Array.isArray(usersRes.data) ? (usersRes.data as User[]) : []);
      })
      .catch(() => toast.error('Failed to load section owners'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/feed" replace />;

  const save = async (section: string) => {
    const ownerId = Number(pending[section]);
    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      toast.error('Pick a user first');
      return;
    }
    setSavingSection(section);
    try {
      const res = await api.patch(`/admin/section-owners/${section}`, { ownerId });
      const updated = res.data as unknown as OwnerRow;
      setRows((prev) => prev.map((r) => (r.section === section ? updated : r)));
      setPending((p) => { const { [section]: _, ...rest } = p; return rest; });
      toast.success(`${SECTION_LABEL[section] ?? section} owner updated`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update owner');
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <div className="al-view max-w-[900px]">
      <h1 className="font-heading text-[30px] text-ink mb-1">Section Owners</h1>
      <p className="text-ink-faint m-0 mb-6 text-[15px]">
        Every section has one owner responsible for responding within the SLA. Reassigning here only
        affects new posts — in-flight owners stay put.
      </p>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #eae5f2' }}>
        {loading ? (
          <div className="p-5 flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="al-skel" style={{ height: 48 }} />)}
          </div>
        ) : (
          rows.map((row, i) => {
            const owner = row.owner;
            const dirty = !!pending[row.section];
            return (
              <div
                key={row.section}
                className="flex items-center gap-3.5 px-5 py-[15px]"
                style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid #f0ecf7' }}
              >
                {/* Section */}
                <span className="w-[92px] shrink-0 text-[14px] font-semibold text-ink">
                  {SECTION_LABEL[row.section] ?? row.section}
                </span>

                {/* Current owner */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {owner ? (
                    <>
                      <span
                        className="w-7 h-7 rounded-full text-white grid place-items-center text-[10px] font-bold shrink-0"
                        style={{ background: ROLE_COLOR[owner.role] ?? '#8018de' }}
                      >
                        {initialsOf(owner.name)}
                      </span>
                      <span className="text-[14px] text-ink font-medium truncate">{owner.name}</span>
                      <span className="text-[12px] text-ink-whisper shrink-0">{ROLE_LABEL[owner.role] ?? owner.role}</span>
                    </>
                  ) : (
                    <span className="text-[13px] italic text-ink-whisper">— unassigned —</span>
                  )}
                </div>

                {/* Reassign */}
                <select
                  value={pending[row.section] ?? ''}
                  onChange={(e) => setPending((p) => ({ ...p, [row.section]: e.target.value }))}
                  className="px-3 py-2 rounded-[9px] text-[13.5px] font-medium text-ink focus:outline-none w-[200px] shrink-0"
                  style={{ border: '1.5px solid #e8e3f0', background: '#fff' }}
                >
                  <option value="">Reassign to…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} · {ROLE_LABEL[u.role] ?? u.role}</option>
                  ))}
                </select>

                <button
                  onClick={() => save(row.section)}
                  disabled={savingSection === row.section || !dirty}
                  className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold text-white shrink-0 disabled:opacity-40"
                  style={{ background: '#8018de' }}
                >
                  {savingSection === row.section ? '…' : 'Save'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminSectionOwnersPage;

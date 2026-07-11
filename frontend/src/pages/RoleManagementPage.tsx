import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '@/api/axios';
import { useAuthStore } from '@/stores/auth.store';
import { User, UserRole } from '@/types';
import toast from 'react-hot-toast';
import { ROLE_LABEL, ROLE_COLOR, initialsOf } from '@/lib/loopMeta';

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'FOUNDER', 'FRONTEND', 'BACKEND', 'DEVOPS', 'AI_ML'];

const RoleManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const isAuthorized = user?.role === 'FOUNDER' || user?.role === 'ADMIN';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/users/manage');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchUsers();
  }, [isAuthorized]);

  if (!isAuthorized) return <Navigate to="/feed" replace />;

  const handleRoleChange = async (userId: number, role: UserRole) => {
    setUpdatingId(userId);
    try {
      const { data } = await api.patch(`/auth/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
      toast.success('Role updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
      fetchUsers(); // revert optimistic select value
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="al-view max-w-[900px]">
      <h1 className="font-heading text-[30px] text-ink mb-1">Role Management</h1>
      <p className="text-ink-faint m-0 mb-6 text-[15px]">
        Promote or reassign team roles. You can't change your own role or demote the last founder.
      </p>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #eae5f2' }}>
        {loading ? (
          <div className="p-5 flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="al-skel" style={{ height: 48 }} />)}
          </div>
        ) : (
          users.map((u, i) => {
            const locked = u.id === user?.id;
            return (
              <div
                key={u.id}
                className="flex items-center gap-3.5 px-5 py-[15px]"
                style={{ borderBottom: i === users.length - 1 ? 'none' : '1px solid #f0ecf7' }}
              >
                <span
                  className="w-[38px] h-[38px] rounded-full text-white grid place-items-center text-[14px] font-bold shrink-0"
                  style={{ background: ROLE_COLOR[u.role] ?? '#8018de' }}
                >
                  {initialsOf(u.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-ink truncate">
                    {u.name} {locked && <span className="text-ink-whisper font-normal text-[13px]">(you)</span>}
                  </div>
                  <div className="text-[13px] text-ink-whisper truncate">{u.email}</div>
                </div>
                <select
                  value={u.role}
                  disabled={locked || updatingId === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                  className="px-3 py-2 rounded-[9px] text-[13.5px] font-semibold text-ink focus:outline-none"
                  style={{ border: '1.5px solid #e8e3f0', background: locked ? '#f4f2f8' : '#fff', cursor: locked ? 'not-allowed' : 'pointer' }}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </div>
            );
          })
        )}
      </div>

      <p className="text-[13px] text-ink-whisper mt-3">
        Admin &amp; Founder hold all permissions. Section roles (Frontend, Backend, DevOps, AI/ML) can assign,
        transition workflow, and view their department.
      </p>
    </div>
  );
};

export default RoleManagementPage;

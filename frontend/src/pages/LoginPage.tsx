import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

// Six demo accounts seeded by backend/audit-seed.ts. Order matches the dc.html
// grid (2×3) so the mock and the app share a mental model.
const DEMO_ACCOUNTS: {
  email: string;
  name: string;
  role: 'FOUNDER' | 'ADMIN' | 'BACKEND' | 'FRONTEND' | 'DEVOPS' | 'AI_ML';
}[] = [
  { email: 'audit-founder@test.local',  name: 'Founder',  role: 'FOUNDER'  },
  { email: 'audit-admin@test.local',    name: 'Admin',    role: 'ADMIN'    },
  { email: 'audit-frontend@test.local', name: 'Frontend', role: 'FRONTEND' },
  { email: 'audit-backend@test.local',  name: 'Backend',  role: 'BACKEND'  },
  { email: 'audit-devops@test.local',   name: 'DevOps',   role: 'DEVOPS'   },
  { email: 'audit-aiml@test.local',     name: 'AI/ML',    role: 'AI_ML'    },
];

const ROLE_COLOR: Record<string, string> = {
  ADMIN:    '#8018de',
  FOUNDER:  '#6a0fc0',
  FRONTEND: '#0a6dd8',
  BACKEND:  '#1e8f4e',
  DEVOPS:   '#f15d24',
  AI_ML:    '#c79000',
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', FOUNDER: 'Founder', FRONTEND: 'Frontend', BACKEND: 'Backend', DEVOPS: 'DevOps', AI_ML: 'AI / ML',
};

const DEMO_PASSWORD = 'auditpass1234';

const initialsOf = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const LoginPage: React.FC = () => {
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const attempt = async (email: string, password: string) => {
    setError('');
    const fe: typeof fieldErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) fe.email = 'Enter a valid email address';
    if (password.length < 1) fe.password = 'Password is required';
    if (Object.keys(fe).length) { setFieldErrors(fe); return; }
    setFieldErrors({});
    try {
      await login(email, password);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    attempt(form.email, form.password);
  };

  return (
    <div className="min-h-screen w-full grid" style={{ background: '#f6f4fa', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' }}>
      <AuthBrandPanel />

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[380px]">
          <h2 className="font-heading text-[30px] text-ink mb-1.5">Welcome back</h2>
          <p className="text-ink-faint mb-7 text-[15px]">Sign in to your Athwart Loop workspace.</p>

          {error && (
            <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-sm" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@athwart.ai"
              className="w-full px-3.5 py-3 rounded-[10px] text-[15px] focus:outline-none"
              style={{ border: '1.5px solid #e2e2e2' }}
            />
            <div className="h-[18px] text-[12px] mb-2" style={{ color: '#f15d24' }}>{fieldErrors.email || ''}</div>

            <label className="block text-[13px] font-semibold text-ink mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-3 rounded-[10px] text-[15px] focus:outline-none"
              style={{ border: '1.5px solid #e2e2e2' }}
            />
            <div className="h-[18px] text-[12px] mb-2" style={{ color: '#f15d24' }}>{fieldErrors.password || ''}</div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[10px] font-semibold text-[15px] text-white transition-colors mt-1"
              style={{ background: loading ? '#a875df' : '#8018de' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="text-center mt-4.5 mt-4 text-sm text-ink-faint">
            New to Athwart?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#8018de' }}>
              Create one
            </Link>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="text-[12px] uppercase tracking-[0.06em] text-ink-whisper font-semibold mb-3">
              Quick demo sign-in
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => {
                    setForm({ email: acct.email, password: DEMO_PASSWORD });
                    attempt(acct.email, DEMO_PASSWORD);
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] bg-white text-left transition-colors hover:bg-brand-faintest"
                  style={{ border: '1.5px solid #e2e2e2' }}
                >
                  <span
                    className="w-7 h-7 rounded-full grid place-items-center text-white text-[12px] font-bold shrink-0"
                    style={{ background: ROLE_COLOR[acct.role] }}
                  >
                    {initialsOf(acct.name)}
                  </span>
                  <span className="overflow-hidden">
                    <span className="block text-[13px] font-semibold text-ink leading-none">{acct.name}</span>
                    <span className="block text-[11px] text-ink-faint mt-1">{ROLE_LABEL[acct.role]}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

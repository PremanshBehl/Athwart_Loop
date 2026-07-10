import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

const RegisterPage: React.FC = () => {
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fe: typeof fieldErrors = {};
    if (form.name.trim().length < 2) fe.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) fe.email = 'Enter a valid email address';
    if (form.password.length < 8) fe.password = 'Password must be at least 8 characters';
    if (Object.keys(fe).length) { setFieldErrors(fe); return; }
    setFieldErrors({});
    try {
      await register(form);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen w-full grid" style={{ background: '#f6f4fa', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' }}>
      <AuthBrandPanel />

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[380px]">
          <h2 className="font-heading text-[30px] text-ink mb-1.5">Create your account</h2>
          <p className="text-ink-faint mb-7 text-[15px]">Join the loop and start collaborating.</p>

          {error && (
            <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-sm" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Cooper"
              className="w-full px-3.5 py-3 rounded-[10px] text-[15px] focus:outline-none"
              style={{ border: '1.5px solid #e2e2e2' }}
            />
            <div className="h-[18px] text-[12px] mb-2" style={{ color: '#f15d24' }}>{fieldErrors.name || ''}</div>

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
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-3 rounded-[10px] text-[15px] focus:outline-none"
              style={{ border: '1.5px solid #e2e2e2' }}
            />
            <div className="h-[18px] text-[12px] mb-2" style={{ color: '#f15d24' }}>{fieldErrors.password || ''}</div>

            <div className="rounded-[10px] px-3.5 py-2.5 text-[13px] leading-[1.5] mb-4" style={{ background: '#ede3ff', color: '#6a0fc0' }}>
              New accounts join as <b>Frontend</b>. An admin or founder promotes roles later — signup can't pick one.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[10px] font-semibold text-[15px] text-white transition-colors mt-1"
              style={{ background: loading ? '#a875df' : '#8018de' }}
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="text-center mt-4 text-sm text-ink-faint">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#8018de' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

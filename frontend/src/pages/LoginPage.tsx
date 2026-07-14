import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';


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
        <div className="w-full max-w-[400px]">
          <h2 className="font-serif text-[36px] text-[#202020] mb-2 font-medium">Welcome back</h2>
          <p className="text-[#606060] mb-8 text-[16px]">Sign in to your Athwart Loop workspace.</p>

          {error && (
            <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-sm" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-[14px] font-semibold text-[#202020] mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@athwart.ai"
              className="w-full px-4 py-3.5 rounded-[12px] text-[15px] focus:outline-none mb-1"
              style={{ border: '1px solid #e0e0e0', background: '#fff' }}
            />
            <div className="h-[20px] text-[12px] mb-2" style={{ color: '#f15d24' }}>{fieldErrors.email || ''}</div>

            <div className="flex justify-between items-end mb-2">
              <label className="block text-[14px] font-semibold text-[#202020]">Password</label>
              <Link to="/forgot-password" className="text-[13px] font-semibold" style={{ color: '#8018de' }}>Forgot?</Link>
            </div>
            <div className="relative mb-1">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-[12px] text-[15px] focus:outline-none"
                style={{ border: '1px solid #e0e0e0', background: '#fff' }}
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-wider text-gray-400 hover:text-gray-600">SHOW</button>
            </div>
            <div className="h-[20px] text-[12px] mb-4" style={{ color: '#f15d24' }}>{fieldErrors.password || ''}</div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-[12px] font-semibold text-[16px] text-white transition-colors mt-2"
              style={{ background: loading ? '#a875df' : '#8018de', boxShadow: '0 4px 14px rgba(128, 24, 222, 0.3)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="text-center mt-6 text-[15px] text-[#606060]">
            New to Athwart?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#8018de' }}>
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

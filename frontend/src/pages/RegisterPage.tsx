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
        <div className="w-full max-w-[400px]">
          <h2 className="font-serif text-[36px] text-[#202020] mb-2 font-medium">Create your account</h2>
          <p className="text-[#606060] mb-8 text-[16px]">Join the loop and start collaborating.</p>

          {error && (
            <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-sm" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-[14px] font-semibold text-[#202020] mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Cooper"
              className="w-full px-4 py-3.5 rounded-[12px] text-[15px] focus:outline-none mb-1"
              style={{ border: '1px solid #e0e0e0', background: '#fff' }}
            />
            <div className="h-[20px] text-[12px] mb-2" style={{ color: '#f15d24' }}>{fieldErrors.name || ''}</div>

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

            <label className="block text-[14px] font-semibold text-[#202020] mb-2">Password</label>
            <div className="relative mb-1">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3.5 rounded-[12px] text-[15px] focus:outline-none"
                style={{ border: '1px solid #e0e0e0', background: '#fff' }}
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-wider text-gray-400 hover:text-gray-600">SHOW</button>
            </div>
            <div className="h-[20px] text-[12px] mb-2" style={{ color: '#f15d24' }}>{fieldErrors.password || ''}</div>

            <div className="rounded-[12px] px-4 py-3 text-[13px] leading-[1.5] mb-4" style={{ background: '#ede3ff', color: '#6a0fc0' }}>
              New accounts join as <b>Frontend</b>. An admin or founder promotes roles later — signup can't pick one.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-[12px] font-semibold text-[16px] text-white transition-colors mt-2"
              style={{ background: loading ? '#a875df' : '#8018de', boxShadow: '0 4px 14px rgba(128, 24, 222, 0.3)' }}
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="text-center mt-6 text-[15px] text-[#606060]">
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

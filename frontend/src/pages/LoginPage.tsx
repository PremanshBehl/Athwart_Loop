import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import AuthField from '@/components/auth/AuthField';

const LoginPage: React.FC = () => {
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [btnHover, setBtnHover] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <AuthBrandPanel />

      <section
        className="flex-1 lg:flex-[1_1_48%] min-w-0 flex items-center justify-center"
        style={{ background: '#f6f3fb', padding: '48px 40px' }}
      >
        <div className="w-full" style={{ maxWidth: '400px' }}>
          <h2 className="font-heading" style={{ fontWeight: 700, fontSize: '38px', lineHeight: 1.1, margin: '0 0 10px', color: '#1e1a24' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '16px', color: '#737373', margin: '0 0 36px' }}>
            Sign in to your Athwart Loop workspace.
          </p>

          {error && (
            <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-sm" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <AuthField
              id="aw-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="you@athwart.ai"
              autoComplete="username"
              error={fieldErrors.email}
            />

            <AuthField
              id="aw-pw"
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
              autoComplete="current-password"
              error={fieldErrors.password}
            />

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              className="w-full font-sans text-white"
              style={{
                height: '54px',
                marginTop: '20px',
                background: loading ? '#a875df' : btnHover ? '#6a11bd' : '#8018de',
                fontSize: '17px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'default' : 'pointer',
                boxShadow: '0 10px 24px rgba(128,24,222,0.28)',
                transition: 'background .15s, transform .1s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '15px', color: '#737373', margin: '36px 0 0' }}>
            New to Athwart?{' '}
            <Link to="/register" style={{ fontWeight: 700, color: '#8018de' }}>
              Create one
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;

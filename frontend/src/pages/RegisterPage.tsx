import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import AuthField from '@/components/auth/AuthField';

const RegisterPage: React.FC = () => {
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [btnHover, setBtnHover] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <AuthBrandPanel />

      <section
        className="flex-1 lg:flex-[1_1_48%] min-w-0 flex items-center justify-center"
        style={{ background: '#f6f3fb', padding: '48px 40px' }}
      >
        <div className="w-full" style={{ maxWidth: '400px' }}>
          <h2 className="font-heading" style={{ fontWeight: 700, fontSize: '38px', lineHeight: 1.1, margin: '0 0 10px', color: '#1e1a24' }}>
            Create your account
          </h2>
          <p style={{ fontSize: '16px', color: '#737373', margin: '0 0 36px' }}>
            Join the loop and start collaborating.
          </p>

          {error && (
            <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-sm" style={{ background: '#fff0eb', border: '1px solid #f9c3ad', color: '#b23c12' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <AuthField
              id="aw-name"
              label="Name"
              type="text"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Jane Cooper"
              autoComplete="name"
              error={fieldErrors.name}
            />

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={fieldErrors.password}
            />

            <div className="rounded-[12px] px-4 py-3 text-[13px] leading-[1.5]" style={{ background: '#ede3ff', color: '#6a0fc0', marginTop: '4px' }}>
              New accounts join as <b>Frontend</b>. An admin or founder promotes roles later — signup can't pick one.
            </div>

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
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '15px', color: '#737373', margin: '36px 0 0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 700, color: '#8018de' }}>
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;

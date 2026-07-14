import React, { useState } from 'react';

interface AuthFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  /** Optional right-aligned element beside the label (e.g. a "Forgot?" link). */
  labelRight?: React.ReactNode;
}

/**
 * Labelled auth input matching the Athwart Loop hi-fi handoff. Password fields
 * get an inline SHOW / HIDE toggle. A fixed-height error slot keeps the form
 * from shifting when validation messages appear.
 */
const AuthField: React.FC<AuthFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  labelRight,
}) => {
  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  const inputType = isPassword ? (reveal ? 'text' : 'password') : type;

  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ marginBottom: '9px' }}>
        <label htmlFor={id} className="font-sans" style={{ fontSize: '14px', fontWeight: 600, color: '#3a3341', letterSpacing: '0.01em' }}>
          {label}
        </label>
        {labelRight}
      </div>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`auth-input${isPassword ? ' auth-input--password' : ''}${error ? ' auth-input--error' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label="Toggle password visibility"
            className="absolute flex items-center justify-center"
            style={{
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '38px',
              width: '38px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9a92a6',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {reveal ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>

      <div style={{ minHeight: '18px', fontSize: '12px', marginTop: '6px', color: '#f15d24' }}>{error || ''}</div>
    </div>
  );
};

export default AuthField;

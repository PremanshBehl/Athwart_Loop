import React from 'react';
import logoWhiteFull from '@/assets/logo-white-full.png';
import illoPlane from '@/assets/illo-plane.png';
import illoLadder from '@/assets/illo-ladder.png';

type Illustration = 'plane' | 'ladder';

interface AuthBrandPanelProps {
  illustration?: Illustration;
}

/**
 * Left brand panel for the auth screens — recreated from the Athwart Loop
 * hi-fi handoff. Uses the official brand PNG assets (do not redraw these).
 */
const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({ illustration = 'plane' }) => (
  <section
    className="relative overflow-hidden flex-col justify-between hidden lg:flex lg:flex-[1_1_52%] min-w-0 text-white"
    style={{ background: '#8018de', padding: '48px 56px 56px' }}
  >
    {/* Ambient glow circle (decorative) */}
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        right: '-120px',
        bottom: '-60px',
        width: '520px',
        height: '520px',
        background:
          'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)',
      }}
    />

    {/* Signature flowing line (decorative) */}
    <svg
      viewBox="0 0 600 120"
      width="70%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute pointer-events-none"
      style={{ left: '10%', top: '22%', opacity: 0.28 }}
    >
      <path
        d="M4 70 C 90 8, 180 8, 250 60 C 320 112, 410 112, 500 44 C 545 12, 580 20, 596 40"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>

    {/* Logo lockup */}
    <div className="relative z-[2] flex items-end" style={{ gap: '18px' }}>
      <img src={logoWhiteFull} alt="Athwart" style={{ height: '78px', width: 'auto', display: 'block' }} />
      <span style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.45)', marginBottom: '6px' }} />
      <span
        className="font-heading italic"
        style={{ fontWeight: 400, fontSize: '30px', lineHeight: 1, color: '#ffffff', opacity: 0.92, marginBottom: '12px' }}
      >
        loop
      </span>
    </div>

    {/* Illustration */}
    <div className="relative z-[2] flex-1 flex items-center justify-center min-h-0" style={{ padding: '24px 0' }}>
      {illustration === 'ladder' ? (
        <img
          src={illoLadder}
          alt=""
          style={{ height: 'min(74%,420px)', width: 'auto', filter: 'drop-shadow(0 20px 36px rgba(0,0,0,0.2))' }}
        />
      ) : (
        <img
          src={illoPlane}
          alt=""
          className="animate-floaty motion-reduce:animate-none"
          style={{ width: 'min(46%,300px)', height: 'auto', filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.22))' }}
        />
      )}
    </div>

    {/* Headline + subcopy */}
    <div className="relative z-[2]" style={{ maxWidth: '520px' }}>
      <h1
        className="font-heading"
        style={{ fontWeight: 700, fontSize: '46px', lineHeight: 1.08, letterSpacing: '-0.01em', color: '#ffffff', margin: '0 0 18px' }}
      >
        The internal loop for product teams.
      </h1>
      <p style={{ fontSize: '17px', lineHeight: 1.6, color: '#ede3ff', margin: 0, maxWidth: '440px' }}>
        Questions, problems and ideas — routed to the right owner, resolved in the open, and swept into the knowledge base.
      </p>
    </div>
  </section>
);

export default AuthBrandPanel;

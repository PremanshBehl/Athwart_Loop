import React from 'react';
import { BrandMark } from '@/components/shared/BrandMark';

// Left panel used by both LoginPage and RegisterPage — big purple canvas
// with the brand mark, tagline and three feature keywords along the bottom.
// Matches the .dc.html spec verbatim.
const AuthBrandPanel: React.FC = () => (
  <div
    className="relative flex-col justify-between p-14 text-white overflow-hidden hidden lg:flex"
    style={{ background: '#8018de' }}
  >
    <div className="relative z-10 flex items-center gap-3.5">
      <BrandMark size={46} color="#ffffff" />
      <span className="font-heading text-[26px] font-bold tracking-wide">
        athwart<span className="opacity-70 font-normal"> loop</span>
      </span>
    </div>

    <div className="relative z-10">
      <h1 className="font-heading text-[46px] leading-[1.08] text-white mb-5">
        The internal loop for product teams.
      </h1>
      <p className="text-[18px] leading-[1.6] font-light text-[#ede3ff] max-w-[30ch]">
        Questions, problems and ideas — routed to the right owner, resolved in the open, and swept into the knowledge base.
      </p>
    </div>



    {/* Decorative radial glow bottom-right */}
    <div
      aria-hidden
      className="absolute w-[460px] h-[460px] rounded-full"
      style={{
        right: '-120px',
        bottom: '-120px',
        background:
          'radial-gradient(circle at 30% 30%, rgba(255,255,255,.14), transparent 60%)',
      }}
    />
    {/* Faded oversized brand mark */}
    <div
      aria-hidden
      className="absolute opacity-[0.12]"
      style={{ right: '40px', top: '80px' }}
    >
      <BrandMark size={260} color="#ffffff" />
    </div>
  </div>
);

export default AuthBrandPanel;

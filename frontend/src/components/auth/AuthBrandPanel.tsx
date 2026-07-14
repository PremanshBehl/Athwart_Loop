import React from 'react';
import { BrandMark } from '@/components/shared/BrandMark';

const PaperAirplaneSVG = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
    {/* Wavy background line */}
    <svg className="absolute w-full h-[200px]" preserveAspectRatio="none" viewBox="0 0 1000 200">
      <path
        d="M -100 100 Q 200 0 500 100 T 1100 80"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
    </svg>
    {/* Sketchy paper airplane and dashed trail */}
    <div className="relative w-[300px] h-[300px]">
      <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-lg" style={{ transform: 'rotate(-5deg)' }}>
        {/* Trail */}
        <path
          d="M 220 180 C 230 190, 240 220, 220 230 C 190 240, 180 200, 200 180 C 220 160, 240 130, 220 100"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        {/* Airplane base shadow */}
        <polygon points="120,80 180,180 140,165" fill="rgba(0,0,0,0.15)" />
        {/* Airplane body */}
        <polygon points="115,85 175,175 135,160" fill="#fcfcfc" stroke="#333" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Airplane fold */}
        <polygon points="115,85 135,160 145,185 175,175" fill="#f3f3f3" stroke="#333" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="115,85 145,185 125,180" fill="#e0e0e0" stroke="#333" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Additional sketchy lines */}
        <line x1="115" y1="85" x2="145" y2="185" stroke="#333" strokeWidth="1.5" />
      </svg>
    </div>
  </div>
);

const AuthBrandPanel: React.FC = () => (
  <div
    className="relative flex flex-col justify-between p-14 text-white overflow-hidden hidden lg:flex"
    style={{ background: '#7c28e8' }}
  >
    {/* Top Logo Area */}
    <div className="relative z-10 flex items-center">
      <div className="flex flex-col items-center mr-6">
        <BrandMark size={54} color="#ffffff" />
        <span className="font-sans text-[28px] leading-none mt-1 tracking-tight" style={{ fontWeight: 400 }}>athwart</span>
      </div>
      <div className="w-[1px] h-[50px] bg-white opacity-40 mr-6" />
      <span className="font-serif italic text-[38px] tracking-wide mt-1" style={{ fontWeight: 300 }}>
        loop
      </span>
    </div>

    {/* Center Graphic */}
    <PaperAirplaneSVG />

    {/* Bottom Text */}
    <div className="relative z-10">
      <h1 className="font-serif text-[48px] leading-[1.1] text-white mb-5 font-semibold">
        The internal loop for<br />product teams.
      </h1>
      <p className="text-[18px] leading-[1.6] font-light text-[#ede3ff] max-w-[42ch]">
        Questions, problems and ideas — routed to the right owner, resolved in the open, and swept into the knowledge base.
      </p>
    </div>
  </div>
);

export default AuthBrandPanel;

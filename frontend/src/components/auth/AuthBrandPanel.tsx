import React from 'react';

// Inline SVG to avoid the white box issue from logo.jpeg
const AthwartLogoSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M60 160 C30 150 25 110 40 80 C55 50 80 30 100 25 C120 20 145 35 155 60 C165 85 155 120 135 140 C120 155 100 162 82 158 C72 156 64 150 60 160 Z"
      stroke="#ffffff"
      strokeWidth="11"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M130 145 C145 148 160 155 168 168"
      stroke="#ffffff"
      strokeWidth="11"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="152" cy="118" r="11" fill="#ffffff" />
  </svg>
);

const PaperAirplaneSVG = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
    {/* Wavy background line */}
    <svg className="absolute w-full h-[250px]" preserveAspectRatio="none" viewBox="0 0 1000 250">
      <path
        d="M -100 150 Q 250 50 550 150 T 1200 100"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />
    </svg>
    {/* Sketchy paper airplane and dashed trail */}
    <div className="relative w-[360px] h-[360px]">
      <svg viewBox="0 0 360 360" className="w-full h-full drop-shadow-2xl">
        {/* Trail */}
        <path
          d="M 250 280 C 300 290, 310 230, 270 200 C 230 170, 210 230, 180 200 C 155 175, 165 140, 160 130"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2.5"
          strokeDasharray="4 7"
          strokeLinecap="round"
        />
        {/* Airplane pointing top-left */}
        <g transform="translate(180, 140) scale(-4, 4) rotate(15)">
          {/* Shadow offset */}
          <path d="m22 5-7 20-4-9-9-4Z" fill="rgba(0,0,0,0.15)" />
          
          {/* Main Body */}
          <path d="m22 2-7 20-4-9-9-4Z" fill="#fdfdfd" stroke="#2b2b2b" strokeWidth="0.6" strokeLinejoin="round" />
          <path d="M22 2 11 13" fill="none" stroke="#2b2b2b" strokeWidth="0.6" strokeLinejoin="round" />
          
          {/* Bottom Fold */}
          <polygon points="11,13 15,22 15,16" fill="#e2e2e2" stroke="#2b2b2b" strokeWidth="0.6" strokeLinejoin="round" />
        </g>
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
        <AthwartLogoSVG size={54} />
        <span className="font-sans text-[26px] leading-none mt-1 tracking-tight" style={{ fontWeight: 400 }}>athwart</span>
      </div>
      <div className="w-[1px] h-[50px] bg-white opacity-40 mr-6" />
      <span className="font-serif italic text-[36px] tracking-wide mt-1" style={{ fontWeight: 300 }}>
        loop
      </span>
    </div>

    {/* Center Graphic */}
    <PaperAirplaneSVG />

    {/* Bottom Text */}
    <div className="relative z-10">
      <h1 className="font-serif text-[44px] leading-[1.1] text-white mb-5 font-semibold">
        The internal loop for<br />product teams.
      </h1>
      <p className="text-[17px] leading-[1.6] font-light text-[#ede3ff] max-w-[44ch]">
        Questions, problems and ideas — routed to the right owner, resolved in the open, and swept into the knowledge base.
      </p>
    </div>
  </div>
);

export default AuthBrandPanel;

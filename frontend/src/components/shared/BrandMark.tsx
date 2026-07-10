import React from 'react';

// Athwart loop mark (from the brand manual). One SVG, colorable via stroke/fill props.
export const BrandMark: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 34,
  color = '#8018de',
  className = '',
}) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill="none"
    className={className}
    style={{ display: 'block' }}
    aria-hidden="true"
  >
    <path
      d="M33 88 C13 74 20 34 42 22 C55 15 71 17 79 30 C87 43 82 63 65 70"
      stroke={color}
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M33 88 C48 76 60 72 65 70 C72 68 80 72 86 84"
      stroke={color}
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="67" cy="55" r="8" fill={color} />
  </svg>
);

export const BrandWordmark: React.FC<{ mono?: boolean }> = ({ mono = false }) => (
  <span className="font-heading text-[19px] font-bold text-ink leading-none whitespace-nowrap">
    athwart<span className={mono ? 'opacity-70 font-normal' : 'text-ink-faint font-normal'}> loop</span>
  </span>
);

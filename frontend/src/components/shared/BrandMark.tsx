import React from 'react';

// Athwart loop mark (from the brand manual). One SVG, colorable via stroke/fill props.
export const BrandMark: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 34,
  className = '',
}) => (
  <img
    src="/logo.jpeg"
    alt="Athwart Logo"
    width={size}
    height={size}
    className={className}
    style={{ display: 'block', objectFit: 'contain' }}
    aria-hidden="true"
  />
);

export const BrandWordmark: React.FC<{ mono?: boolean }> = ({ mono = false }) => (
  <span className="font-heading text-[19px] font-bold text-ink leading-none whitespace-nowrap">
    athwart<span className={mono ? 'opacity-70 font-normal' : 'text-ink-faint font-normal'}> loop</span>
  </span>
);

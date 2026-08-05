import React from 'react';

type AccentDotProps = {
  className?: string;
};

const AccentDot = ({ className = '' }: AccentDotProps) => (
  <span
    data-testid="accent-dot"
    className={`h-1.5 w-1.5 shrink-0 rounded-full ${className}`.trim()}
    style={{ backgroundColor: 'var(--accent-blue)' }}
    aria-hidden
  />
);

export type { AccentDotProps };
export { AccentDot };

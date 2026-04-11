import React from 'react';

type SurfaceTone = 'default' | 'warm' | 'muted';
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

const paddingClass: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

type SurfacePanelProps = {
  children: React.ReactNode;
  className?: string;
  tone?: SurfaceTone;
  padding?: SurfacePadding;
};

const SurfacePanel = ({
  children,
  className = '',
  tone = 'default',
  padding = 'md',
}: SurfacePanelProps) => {
  const toneStyle: Record<SurfaceTone, React.CSSProperties> = {
    default: {
      borderColor: 'color-mix(in srgb, var(--color-theme-border-primary) 60%, transparent)',
      backgroundColor: 'var(--color-theme-bg-surface)',
    },
    warm: {
      borderColor: 'color-mix(in srgb, var(--color-theme-border-primary) 40%, transparent)',
      backgroundColor: 'var(--color-theme-bg-warm)',
    },
    muted: {
      borderColor: 'color-mix(in srgb, var(--color-theme-border-primary) 40%, transparent)',
      backgroundColor: 'var(--color-theme-bg-muted)',
    },
  };

  return (
    <div
      className={['rounded-lg border shadow-sm', paddingClass[padding], className].filter(Boolean).join(' ')}
      style={toneStyle[tone]}
    >
      {children}
    </div>
  );
};

type SectionHeadingProps = {
  children: React.ReactNode;
  className?: string;
};

const SectionHeading = ({ children, className = '' }: SectionHeadingProps) => (
  <p
    className={['text-sm font-medium', className].filter(Boolean).join(' ')}
    style={{ color: 'var(--color-theme-text-secondary)' }}
  >
    {children}
  </p>
);

export { SurfacePanel, SectionHeading };
export type { SurfaceTone, SurfacePadding, SurfacePanelProps, SectionHeadingProps };

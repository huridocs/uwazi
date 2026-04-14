import React, { ReactNode } from 'react';

type BlankStateProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

const BlankState = ({ icon, title, description }: BlankStateProps) => (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center"
    style={{
      borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 60%, transparent)',
      color: 'var(--color-theme-text-secondary)',
      backgroundColor: 'var(--color-theme-surface-raised)',
    }}
  >
    {icon}
    <p className="font-semibold text-lg">{title}</p>
    <p className="text-sm" style={{ color: 'var(--color-theme-text-muted)' }}>
      {description}
    </p>
  </div>
);

export { BlankState };

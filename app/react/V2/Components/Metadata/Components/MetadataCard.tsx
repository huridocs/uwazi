import React, { PropsWithChildren } from 'react';

const MetadataCard = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div
    className={`min-w-0 w-full rounded-md border border-[color-mix(in_srgb,var(--color-theme-border-default)_55%,transparent)] bg-(--color-theme-surface-raised) flex flex-col text-sm gap-(--spacing-theme-2) px-3 py-(--spacing-theme-2) shadow-(--color-theme-shadow-sm) ${className ?? ''}`}
  >
    {children}
  </div>
);

export { MetadataCard };

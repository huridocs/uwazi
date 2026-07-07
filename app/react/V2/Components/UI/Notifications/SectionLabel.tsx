import React from 'react';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="sticky top-0 z-10 bg-warm px-4 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
    {children}
  </div>
);

export { SectionLabel };

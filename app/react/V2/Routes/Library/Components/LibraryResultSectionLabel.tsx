import React from 'react';

const sectionLabelClass =
  'flex min-w-0 items-center gap-1.5 text-meta font-semibold uppercase tracking-wide text-ink-tertiary';

type LibraryResultSectionLabelProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
};

const LibraryResultSectionLabel = ({ icon, children }: LibraryResultSectionLabelProps) => (
  <span className={sectionLabelClass}>
    {icon ? (
      <span className="shrink-0 text-ink-muted" aria-hidden>
        {icon}
      </span>
    ) : null}
    {children}
  </span>
);

export { LibraryResultSectionLabel };

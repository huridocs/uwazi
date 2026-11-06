import React from 'react';

const fileFieldLabelClass =
  'text-meta font-semibold uppercase leading-normal tracking-wider text-ink-secondary';

const FileDetailsField = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="overflow-hidden rounded-md border border-border/40 bg-paper">
    <div className="flex flex-col gap-2 px-4 py-3">
      <span className={fileFieldLabelClass}>{label}</span>
      {children}
    </div>
  </div>
);

export { FileDetailsField, fileFieldLabelClass };

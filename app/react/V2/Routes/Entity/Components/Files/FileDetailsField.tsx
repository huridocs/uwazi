import React from 'react';

const FileDetailsField = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="min-w-0 space-y-1">
    <span className="text-nano font-medium uppercase tracking-wide text-ink-muted">{label}</span>
    <div>{children}</div>
  </div>
);

export { FileDetailsField };

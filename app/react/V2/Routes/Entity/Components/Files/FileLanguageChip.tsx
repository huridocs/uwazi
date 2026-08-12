import React from 'react';

const fileLanguageChipClass =
  'shrink-0 rounded bg-vellum px-1.5 py-0.5 text-tiny font-semibold text-ink-secondary';

const FileLanguageChip = ({ children }: { children: React.ReactNode }) => (
  <span className={fileLanguageChipClass}>{children}</span>
);

export { FileLanguageChip, fileLanguageChipClass };

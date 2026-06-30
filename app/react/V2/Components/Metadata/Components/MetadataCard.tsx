import React, { PropsWithChildren } from 'react';

const MetadataCard = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div
    className={`min-w-0 w-full rounded-md border border-border/40 bg-paper flex flex-col gap-2 px-4 py-3 ${className ?? ''}`}
  >
    {children}
  </div>
);

export { MetadataCard };

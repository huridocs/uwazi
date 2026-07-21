import React, { PropsWithChildren } from 'react';

const MetadataCard = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div
    className={`flex min-w-0 w-full max-w-full flex-col gap-2 overflow-hidden rounded-md border border-border/40 bg-paper px-4 py-3 ${className ?? ''}`}
  >
    {children}
  </div>
);

export { MetadataCard };

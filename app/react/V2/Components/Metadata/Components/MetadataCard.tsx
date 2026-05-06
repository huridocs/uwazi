import React, { PropsWithChildren } from 'react';

const MetadataCard = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div
    className={`border-gray-100 rounded-lg border flex flex-col text-sm gap-2 py-3 px-4 ${className}`}
  >
    {children}
  </div>
);

export { MetadataCard };

import React, { PropsWithChildren } from 'react';

const MetadataCard = ({ children }: PropsWithChildren) => (
  <div className="bg-white border-gray-100 rounded-lg border flex flex-col gap-4 py-3 px-4">
    {children}
  </div>
);

export { MetadataCard };

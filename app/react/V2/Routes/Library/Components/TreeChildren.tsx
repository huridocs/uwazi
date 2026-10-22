import React, { type ReactNode } from 'react';

const TreeChildren = ({ children }: { children: ReactNode }) => (
  <div className="relative ps-9.5">
    <span aria-hidden className="absolute inset-y-1 inset-s-5 w-px bg-border" />
    {children}
  </div>
);

export { TreeChildren };

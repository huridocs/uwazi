import React from 'react';
import { PaneProps } from './types.js';

const Pane = ({
  children,
  className,
  background = 'var(--color-theme-surface-raised, white)',
}: PaneProps) => (
  <div style={{ background }} className={`h-full min-h-0 ${className ?? ''}`}>
    {children}
  </div>
);

export { Pane };

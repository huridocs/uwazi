import React from 'react';
import { PaneProps } from './types.js';

const Pane = ({
  children,
  className,
  background = 'var(--color-theme-surface-raised, white)',
}: PaneProps) => (
  <div
    //tabIndex required by cypress accessibility test
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    tabIndex={0}
    style={{ background }}
    className={`h-full min-h-0 ${className ?? ''}`}
  >
    {children}
  </div>
);

export { Pane };

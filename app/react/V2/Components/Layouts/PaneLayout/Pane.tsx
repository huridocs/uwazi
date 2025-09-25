import React from 'react';
import { PaneProps } from './types';

const Pane = ({ children, className, background = 'white' }: PaneProps) => (
  <div style={{ background }} className={className}>
    {children}
  </div>
);

export { Pane };

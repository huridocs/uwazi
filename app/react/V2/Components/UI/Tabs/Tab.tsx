import React from 'react';
import type { TabProps } from './parseTabChildren.js';

const Tab = ({ id, label, children }: TabProps) => (
  <div className="hidden" id={id} data-label={label}>
    {children}
  </div>
);

export { Tab };
export type { TabProps };

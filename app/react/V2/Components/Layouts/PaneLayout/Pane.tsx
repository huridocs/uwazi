import React from 'react';
import { PaneProps } from '#V2/Components/Layouts/PaneLayout/types.js';

const Pane = ({ children, className, background = 'white' }: PaneProps) => (
  <div
    //tabIndex required by cypress accessibility test
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    tabIndex={0}
    style={{ background }}
    className={className}
  >
    {children}
  </div>
);

export { Pane };

import React from 'react';

import { Translate } from '#app/I18N/index.js';
import { Pill, PillColor } from '#V2/Components/UI/index.js';

const generateDisplayPill =
  ({
    color = 'indigo',
    className = 'font-medium px-1 rounded-md text-xs',
    label = '',
  }: {
    color?: PillColor;
    className?: string;
    label?: string;
  }) =>
  ({ count }: { count: number }) => (
    <Pill color={color} className={className}>
      {count} {label && <Translate>{label}</Translate>}
    </Pill>
  );

export { generateDisplayPill };

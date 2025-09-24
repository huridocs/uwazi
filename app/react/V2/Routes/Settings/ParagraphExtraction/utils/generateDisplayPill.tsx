import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { Pill, PillColor } from '../../../../Components/UI/index.js';

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

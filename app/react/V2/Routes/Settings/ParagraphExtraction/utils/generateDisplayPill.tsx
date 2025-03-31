import React from 'react';
import { Translate } from 'app/I18N';
import { Pill, PillColor } from 'V2/Components/UI';

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

import { Translate } from 'app/I18N';
import React, { ReactElement } from 'react';

type Color = string;

interface LegendDataComponent {
  label?: {
    color?: Color;
    text: ReactElement;
  };
  value: number;
  color: Color;
}

interface TrainingHealthLegendProps {
  data: LegendDataComponent[];
  total: number;
  accuracy: number;
}

const toPercentage = (value: number, total: number) => `${((value / total) * 100).toFixed(2)}%`;

export const TrainingHealthLegend = ({ data, total, accuracy }: TrainingHealthLegendProps) => (
  <ul className="legend">
    {data.map((td: any) =>
      td.label ? (
        <li key={`${td.color}-${td.value}`} style={{ color: td.label.color || td.color }}>
          {td.label.text}{' '}
          <b>
            {td.value} ({toPercentage(td.value, total)})
          </b>
        </li>
      ) : null
    )}
    <li style={{ color: '#6c6c7b' }}>
      <Translate>Accuracy</Translate> {(accuracy * 100).toFixed(2)}%
    </li>
  </ul>
);

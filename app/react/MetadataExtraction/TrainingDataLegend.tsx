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

interface TrainingDataLegendProps {
  data: LegendDataComponent[];
  total: number;
}

const toPercentage = (value: number, total: number) => `${((value / total) * 100).toFixed(2)}%`;

export const TrainingDataLegend = ({ data, total }: TrainingDataLegendProps) => (
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
  </ul>
);

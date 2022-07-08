import React from 'react';
import { GridChart } from './GridChart';

interface TrainingDataDashboardProps {
  stats: any;
}

const mapData = (data: any) => ({
  main: [
    {
      color: '#CD4C4C',
      value: data.labeled,
    },
    {
      color: '#4CAE4C',
      value: data.nonLabeledMatching,
      label: { text: 'Matching' },
    },
    {
      color: '#ECA41A',
      value: data.nonLabeledOthers,
      label: { text: 'Non-matching' },
    },
    {
      color: '#E8E7EC',
      value: data.emptyOrObsolete,
      label: { text: 'Empty / Obsolete', color: 'black' },
    },
  ],
  overlaying: {
    color: '#5073CF',
    value: data.labeledMatching,
    label: { text: 'Training' },
  },
});

export const TrainingDataDashboard = ({ stats }: TrainingDataDashboardProps) => {
  if (!stats) return null;

  const data = mapData(stats);

  const total = data.main.reduce((subtotal, components) => subtotal + components.value, 0);

  return (
    <div className="training-dashboard">
      <ul className="legend">
        <li>
          Total: <b>{total}</b>
        </li>
        <li style={{ color: data.overlaying.color }}>
          {data.overlaying.label.text}{' '}
          <b>
            {data.overlaying.value} ({((data.overlaying.value / total) * 100).toFixed(2)}%)
          </b>
        </li>
        {data.main.map((td: any) =>
          td.label ? (
            <li style={{ color: td.label.color || td.color }}>
              {td.label.text}{' '}
              <b>
                {td.value} ({((td.value / total) * 100).toFixed(2)}%)
              </b>
            </li>
          ) : null
        )}
      </ul>
      <GridChart className="training-dashboard-chart" data={data} />
    </div>
  );
};

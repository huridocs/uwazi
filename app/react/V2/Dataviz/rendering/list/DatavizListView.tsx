import React from 'react';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

type DatavizListViewProps = {
  data: DatavizDataDTO;
};

const DatavizListView = ({ data }: DatavizListViewProps) => {
  const points = data.series[0]?.points ?? [];
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-secondary">
            <th className="py-2 pr-4 font-medium">Label</th>
            <th className="py-2 pr-4 font-medium text-right">Count</th>
            <th className="py-2 font-medium text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {points.map(point => (
            <tr key={String(point.key)} className="border-b border-border-soft">
              <td className="py-2 pr-4 text-ink">{point.label}</td>
              <td className="py-2 pr-4 text-right text-ink">{point.value}</td>
              <td className="py-2 text-right text-ink-secondary">
                {total > 0 ? `${Math.round((point.value / total) * 100)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { DatavizListView };

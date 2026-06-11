import React from 'react';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { hasBreakdownData } from '#V2/Dataviz/utils/twoDimensionalQuery.js';

type DataSummaryTableProps = {
  data: DatavizDataDTO;
};

const DataSummaryTable = ({ data }: DataSummaryTableProps) => {
  const points = data.series[0]?.points ?? [];
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const twoD = hasBreakdownData(data);

  if (twoD) {
    return (
      <div className="overflow-auto border-t border-border pt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-secondary">
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium">Series</th>
              <th className="py-2 pr-4 font-medium text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {points.flatMap(point =>
              (point.breakdown?.length ? point.breakdown : [{ key: '-', label: '—', value: point.value }]).map(
                item => (
                  <tr
                    key={`${String(point.key)}-${String(item.key)}`}
                    className="border-b border-border-soft"
                  >
                    <td className="py-2 pr-4 text-ink">{point.label}</td>
                    <td className="py-2 pr-4 text-ink-secondary">{item.label}</td>
                    <td className="py-2 text-right text-ink">{item.value}</td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-auto border-t border-border pt-3">
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

export { DataSummaryTable };

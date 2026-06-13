import React, { useMemo } from 'react';
import type { DataPoint, DatavizDataDTO } from '#V2/Dataviz/types/data.js';

type DatavizListViewProps = {
  data: DatavizDataDTO;
};

type BreakdownColumn = {
  key: string;
  label: string;
};

const collectBreakdownColumns = (points: DataPoint[]): BreakdownColumn[] => {
  const columnMap = new Map<string, BreakdownColumn>();

  points.forEach(point => {
    point.breakdown?.forEach(item => {
      const key = String(item.key);
      if (!columnMap.has(key)) {
        columnMap.set(key, { key, label: item.label });
      }
    });
  });

  return Array.from(columnMap.values());
};

const hasBreakdown = (points: DataPoint[]) => points.some(point => point.breakdown?.length);

const DatavizListView = ({ data }: DatavizListViewProps) => {
  const points = data.series[0]?.points ?? [];
  const columns = useMemo(() => collectBreakdownColumns(points), [points]);
  const isCrossTab = hasBreakdown(points);

  if (!points.length) {
    return <p className="text-sm text-ink-secondary">No data</p>;
  }

  if (isCrossTab) {
    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-secondary">
              <th className="py-2 pr-4 font-medium" />
              {columns.map(column => (
                <th key={column.key} className="py-2 px-3 font-medium text-right">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map(point => (
              <tr key={String(point.key)} className="border-b border-border-soft">
                <td className="py-2 pr-4 font-medium text-ink">{point.label}</td>
                {columns.map(column => {
                  const cell = point.breakdown?.find(item => String(item.key) === column.key);
                  if (!cell) {
                    return (
                      <td key={column.key} className="py-2 px-3 text-right text-ink-muted">
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={column.key} className="py-2 px-3 text-right text-ink">
                      {cell.value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const total = points.reduce((sum, point) => sum + point.value, 0);

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

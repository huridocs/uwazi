import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { hasBreakdownData } from '#V2/Dataviz/utils/twoDimensionalQuery.js';
import { isMultiSeriesCompare } from '#V2/Dataviz/rendering/alignMultiSeriesForChart.js';

type DataSummaryTableProps = {
  data: DatavizDataDTO;
};

const DataSummaryTable = ({ data }: DataSummaryTableProps) => {
  const twoD = hasBreakdownData(data);
  const isCompare = isMultiSeriesCompare(data);

  if (twoD) {
    const rows = data.series.flatMap(series =>
      series.points.flatMap(point =>
        (point.breakdown?.length
          ? point.breakdown
          : [{ key: '-', label: '—', value: point.value }]
        ).map(item => ({
          sourceLabel: series.label,
          categoryLabel: point.label,
          seriesLabel: item.label,
          value: item.value,
          rowKey: `${series.id}-${String(point.key)}-${String(item.key)}`,
        }))
      )
    );

    return (
      <div className="overflow-auto border-t border-border pt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-secondary">
              {isCompare && (
                <th className="py-2 pr-4 font-medium">
                  <Translate>Source</Translate>
                </th>
              )}
              <th className="py-2 pr-4 font-medium">
                <Translate>Category</Translate>
              </th>
              <th className="py-2 pr-4 font-medium">
                <Translate>Series</Translate>
              </th>
              <th className="py-2 pr-4 font-medium text-right">
                <Translate>Count</Translate>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.rowKey} className="border-b border-border-soft">
                {isCompare && <td className="py-2 pr-4 text-ink-secondary">{row.sourceLabel}</td>}
                <td className="py-2 pr-4 text-ink">{row.categoryLabel}</td>
                <td className="py-2 pr-4 text-ink-secondary">{row.seriesLabel}</td>
                <td className="py-2 text-right text-ink">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const points = data.series[0]?.points ?? [];
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="overflow-auto border-t border-border pt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-secondary">
            <th className="py-2 pr-4 font-medium">
              <Translate>Label</Translate>
            </th>
            <th className="py-2 pr-4 font-medium text-right">
              <Translate>Count</Translate>
            </th>
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

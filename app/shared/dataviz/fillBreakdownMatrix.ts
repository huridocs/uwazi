import type { DataPoint } from '#shared/types/datavizSchema.js';

type SecondaryColumn = {
  key: string;
  label: string;
};

const collectSecondaryColumns = (points: DataPoint[]): SecondaryColumn[] => {
  const columns = new Map<string, SecondaryColumn>();

  points.forEach(point => {
    point.breakdown?.forEach(item => {
      const key = String(item.key);
      if (!columns.has(key)) {
        columns.set(key, { key, label: item.label });
      }
    });
  });

  return Array.from(columns.values());
};

export const hasBreakdownMatrix = (points: DataPoint[]): boolean =>
  collectSecondaryColumns(points).length > 0;

export const fillBreakdownMatrix = (points: DataPoint[]): DataPoint[] => {
  const columns = collectSecondaryColumns(points);
  if (!columns.length) {
    return points;
  }

  return points.map(point => {
    const byKey = new Map((point.breakdown ?? []).map(item => [String(item.key), item]));
    const breakdown = columns.map(column => {
      const existing = byKey.get(column.key);
      if (existing) {
        return existing;
      }
      return {
        key: column.key,
        label: column.label,
        value: 0,
      };
    });
    const value = breakdown.reduce((sum, item) => sum + item.value, 0);

    return {
      ...point,
      breakdown,
      value,
    };
  });
};

import React, { useMemo, useRef } from 'react';
import { useContainerWidth } from './useContainerWidthHook';

type Color = string;

interface GridChartDataComponent {
  color: Color;
  value: number;
  overlaying?: boolean;
}

interface GridChartProps {
  data: GridChartDataComponent[];
  className?: string;
  squareSide?: number;
  spaceBetweenSquares?: number;
}

const getTotalValue = (data: GridChartDataComponent[]) =>
  data.reduce((subtotal, components) => subtotal + components.value, 0);

const buildMainBar = (data: GridChartDataComponent[], ratio: number) => {
  const results: Color[] = [];
  data.forEach(r => {
    const slotsForColor = Math.round(r.value / ratio);
    for (let index = 0; index < slotsForColor; index += 1) {
      results.push(r.color);
    }
  });
  return results;
};

const buildOverlayingBar = (
  overlapedData: GridChartDataComponent,
  mainChart: Color[],
  slots: number,
  ratio: number
) => {
  const results: Color[] = [];
  const slotsForColor = Math.round(overlapedData.value / ratio);
  for (let index = 0; index < slotsForColor; index += 1) {
    results.push(overlapedData.color);
  }
  for (let index = slotsForColor; index < slots; index += 1) {
    results.push(mainChart[index]);
  }
  return results;
};

const addPaddings = (chartData: Color[], slots: number) => {
  const padding = [];

  if (chartData.length > slots) {
    return chartData.slice(0, slots);
  }

  for (let index = chartData.length; index < slots; index += 1) {
    padding.push(chartData[chartData.length - 1]);
  }
  return chartData.concat(padding);
};

const extractOverlying = (data: GridChartDataComponent[]) => {
  const main = [...data];
  const overlayingIndex = data.findIndex(c => c.overlaying);

  if (overlayingIndex >= 0) {
    const [overlaying] = main.splice(overlayingIndex, 1);
    return { main, overlaying };
  }

  return { main };
};

const buildChartData = (columns: number, data: GridChartDataComponent[]): Color[][] => {
  const { main, overlaying } = extractOverlying(data);
  const totalValue = getTotalValue(main);
  const ratio = totalValue / columns;
  const mainChart = buildMainBar(main, ratio);
  const paddedMain = addPaddings(mainChart, columns);

  if (!overlaying) {
    return [paddedMain, paddedMain];
  }

  const overChart = buildOverlayingBar(overlaying, paddedMain, columns, ratio);
  const paddedOver = addPaddings(overChart, columns);
  return [paddedMain, paddedOver];
};

const getColumnsQuantity = (width: number, squareSide: number, spaceBetweenSquares: number) =>
  width ? Math.floor((width - spaceBetweenSquares) / (squareSide + spaceBetweenSquares)) : 0;

const GridChart = ({ data, className, squareSide, spaceBetweenSquares }: GridChartProps) => {
  const side = squareSide || 14;
  const space = spaceBetweenSquares || 2;

  const ref = useRef(null);
  const containerWidth = useContainerWidth(ref);
  const columns = getColumnsQuantity(containerWidth, side, space);
  const entries = useMemo(() => buildChartData(columns, data), [columns, data]);
  const columnKeys = [...Array(columns).keys()];
  const rowKeys = [0, 1];

  return (
    <div ref={ref} className={className} style={{ width: '100%' }}>
      {columns ? (
        <ul className="grid-chart" style={{ height: 2 * side + 1 * space }}>
          {columnKeys.map(col =>
            rowKeys.map(row => (
              <li key={`${col}-${row}`} style={{ backgroundColor: entries[row][col] }} />
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
};

export { GridChart };
export type { GridChartDataComponent };

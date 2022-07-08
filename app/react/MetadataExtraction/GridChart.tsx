import React, { useLayoutEffect, useRef, useState } from 'react';

type Color = string;

interface GridChartDataComponent {
  color: Color;
  value: number;
}

interface GridChartData {
  main: GridChartDataComponent[];
  overlaying: GridChartDataComponent;
}

interface GridChartProps {
  data: GridChartData;
  className?: string;
}

const SQUARE_SIZE = 14;
const MARGIN = 2;

const getTotalValue = (data: GridChartData) =>
  data.main.reduce((subtotal, components) => subtotal + components.value, 0);

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

const buildChartData = (columns: number, data: GridChartData): Color[][] => {
  const totalValue = getTotalValue(data);
  const ratio = totalValue / columns;

  const mainChart = buildMainBar(data.main, ratio);
  const paddedMain = addPaddings(mainChart, columns);
  const overChart = buildOverlayingBar(data.overlaying, paddedMain, columns, ratio);
  const paddedOver = addPaddings(overChart, columns);

  return [paddedMain, paddedOver];
};

function useContainerWidth<T extends HTMLElement>(containerRef: React.RefObject<T>): number {
  const [containerWidth, setWidth] = useState(0);

  useLayoutEffect(() => {
    const readWidth = () => {
      setWidth(containerRef.current?.offsetWidth || 0);
    };

    readWidth();

    window.addEventListener('resize', readWidth);
    return () => {
      window.removeEventListener('resize', readWidth);
    };
  }, []);

  return containerWidth;
}

const GridChart = ({ data, className }: GridChartProps) => {
  const ref = useRef(null);

  const containerWidth = useContainerWidth(ref);

  const columns = containerWidth
    ? Math.floor((containerWidth - MARGIN) / (SQUARE_SIZE + MARGIN))
    : 0;

  const entries = buildChartData(columns, data);

  const columnKeys = [...Array(columns).keys()];
  const rowKeys = [0, 1];

  return (
    <div ref={ref} className={className}>
      {columns ? (
        <ul className="grid-chart" style={{ height: 2 * SQUARE_SIZE + 1 * MARGIN }}>
          {columnKeys.map(col => (
            <>
              {rowKeys.map(row => (
                <li key={`${col}-${row}`} style={{ backgroundColor: entries[row][col] }} />
              ))}
            </>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export { GridChart };
export type { GridChartDataComponent };

import type { ChartType, DatavizManualDataPayload } from '#shared/types/datavizSchema.js';

const categoricalExample: DatavizManualDataPayload = {
  series: [
    {
      id: 'colors',
      label: 'Colors',
      points: [
        { key: 'black', label: 'Black', value: 78 },
        { key: 'white', label: 'White', value: 63 },
        { key: 'silver', label: 'Silver', value: 42 },
        { key: 'red', label: 'Red', value: 28 },
        { key: 'blue', label: 'Blue', value: 22 },
      ],
    },
  ],
  meta: { totalEntities: 248, truncated: false },
};

const wildlifeCrossTabExample: DatavizManualDataPayload = {
  series: [
    {
      id: 'habitat',
      label: 'Habitat',
      points: [
        {
          key: 'forest',
          label: 'Forest',
          value: 86,
          breakdown: [
            { key: 'bear', label: 'Bear', value: 24 },
            { key: 'wolf', label: 'Wolf', value: 18 },
            { key: 'deer', label: 'Deer', value: 44 },
          ],
        },
        {
          key: 'wetland',
          label: 'Wetland',
          value: 52,
          breakdown: [
            { key: 'bear', label: 'Bear', value: 6 },
            { key: 'wolf', label: 'Wolf', value: 4 },
            { key: 'deer', label: 'Deer', value: 42 },
          ],
        },
        {
          key: 'grassland',
          label: 'Grassland',
          value: 67,
          breakdown: [
            { key: 'bear', label: 'Bear', value: 12 },
            { key: 'wolf', label: 'Wolf', value: 28 },
            { key: 'deer', label: 'Deer', value: 27 },
          ],
        },
      ],
    },
  ],
  meta: { totalEntities: 205, truncated: false },
};

const sequentialExample: DatavizManualDataPayload = {
  series: [
    {
      id: 'year',
      label: 'Year',
      points: [
        { key: 2020, label: '2020', value: 45 },
        { key: 2021, label: '2021', value: 62 },
        { key: 2022, label: '2022', value: 78 },
        { key: 2023, label: '2023', value: 41 },
        { key: 2024, label: '2024', value: 22 },
      ],
    },
  ],
  meta: { totalEntities: 248, truncated: false },
};

const scatterExample: DatavizManualDataPayload = {
  series: [
    {
      id: 'cars',
      label: 'Cars',
      points: [
        {
          key: 2000,
          label: '2000',
          value: 10,
          breakdown: [
            { key: 1.6, label: '1.6 L', value: 4 },
            { key: 2.0, label: '2.0 L', value: 6 },
          ],
        },
        {
          key: 2001,
          label: '2001',
          value: 8,
          breakdown: [{ key: 2.2, label: '2.2 L', value: 8 }],
        },
        {
          key: 2002,
          label: '2002',
          value: 5,
          breakdown: [{ key: 1.8, label: '1.8 L', value: 5 }],
        },
      ],
    },
  ],
  meta: { totalEntities: 23, truncated: false },
};

const metricExample: DatavizManualDataPayload = {
  series: [
    {
      id: 'main',
      label: 'Total',
      points: [{ key: 'total', label: 'Total entities', value: 248 }],
    },
  ],
  meta: { totalEntities: 248, truncated: false },
};

export const MANUAL_EXAMPLE_BY_CHART_TYPE: Record<ChartType, DatavizManualDataPayload> = {
  pie: categoricalExample,
  donut: categoricalExample,
  bar: categoricalExample,
  horizontal_bar: categoricalExample,
  gauge: categoricalExample,
  list: wildlifeCrossTabExample,
  stacked_bar: wildlifeCrossTabExample,
  heatmap: wildlifeCrossTabExample,
  line: sequentialExample,
  area: sequentialExample,
  scatter: scatterExample,
  metric: metricExample,
};

export const getManualExampleForChartType = (chartType: ChartType): DatavizManualDataPayload =>
  structuredClone(MANUAL_EXAMPLE_BY_CHART_TYPE[chartType]);

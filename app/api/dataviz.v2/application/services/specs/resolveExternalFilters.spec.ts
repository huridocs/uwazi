import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { resolveExternalFilters } from '../resolveExternalFilters.js';

const CARS_TEMPLATE_ID = '507f1f77bcf86cd799439011';
const OWNERS_TEMPLATE_ID = '507f1f77bcf86cd799439012';

const createDataviz = (overrides?: Partial<ConstructorParameters<typeof Dataviz>[0]>) =>
  new Dataviz({
    id: 'dv_cars',
    name: 'Cars by color',
    query: {
      sources: [{ templateId: CARS_TEMPLATE_ID, alias: 'cars' }],
      dimensions: [{ property: 'colors', propertyType: 'select' }],
      measures: [{ aggregation: 'count' }],
    },
    chart: { type: 'pie' },
    appearance: { colorMode: 'from_data' },
    refresh: { refreshMode: 'live' },
    ...overrides,
  });

const carsTemplate = {
  id: CARS_TEMPLATE_ID,
  properties: [
    { name: 'colors', type: 'select', content: 'th_colors' },
    { name: 'mileage', type: 'numeric' },
    { name: 'model_year', type: 'date' },
    { name: 'model', type: 'text' },
  ],
};

const createTemplatesDS = (
  templates: Array<{
    id: string;
    properties: Array<{ name: string; type: string; content?: string }>;
  }>
): Pick<TemplatesDataSource, 'getByIds'> => ({
  getByIds: jest.fn(async () => templates as never),
});

describe('resolveExternalFilters', () => {
  it('should return empty when no runtime filters are provided', async () => {
    const result = await resolveExternalFilters(createDataviz(), undefined, {
      templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource,
    });

    expect(result).toEqual([]);
  });

  it('should return empty for manual dataviz', async () => {
    const dataviz = createDataviz({
      dataSource: 'manual',
      query: {
        sources: [],
        dimensions: [],
        measures: [{ aggregation: 'count', countMode: 'all' }],
      },
      manualData: {
        series: [{ id: 'main', label: 'Series', points: [{ key: 'a', label: 'A', value: 1 }] }],
      },
      refresh: { refreshMode: 'snapshot_manual' },
    });

    const result = await resolveExternalFilters(
      dataviz,
      [{ property: 'mileage', value: { max: 1000 } }],
      { templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([]);
  });

  it('should resolve numeric max as lte on the exact property', async () => {
    const result = await resolveExternalFilters(
      createDataviz(),
      [{ property: 'mileage', value: { max: 80000 } }],
      { templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([
      {
        id: 'external:mileage:cars:mileage',
        scope: 'external',
        sourceAlias: 'cars',
        property: 'mileage',
        propertyType: 'numeric',
        operator: 'lte',
        to: 80000,
      },
    ]);
  });

  it('should resolve numeric min/max as between', async () => {
    const result = await resolveExternalFilters(
      createDataviz(),
      [{ property: 'mileage', value: { min: 1000, max: 50000 } }],
      { templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([
      expect.objectContaining({
        property: 'mileage',
        operator: 'between',
        from: 1000,
        to: 50000,
        scope: 'external',
      }),
    ]);
  });

  it('should resolve thesaurus values as in', async () => {
    const result = await resolveExternalFilters(
      createDataviz(),
      [{ property: 'colors', value: { values: ['color_black', 'color_red'] } }],
      { templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([
      expect.objectContaining({
        property: 'colors',
        propertyType: 'select',
        operator: 'in',
        values: ['color_black', 'color_red'],
        scope: 'external',
      }),
    ]);
  });

  it('should resolve date ISO strings to unix seconds', async () => {
    const result = await resolveExternalFilters(
      createDataviz(),
      [
        {
          property: 'model_year',
          value: { from: '2020-01-01T00:00:00.000Z', to: '2021-01-01T00:00:00.000Z' },
        },
      ],
      { templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([
      expect.objectContaining({
        property: 'model_year',
        propertyType: 'date',
        operator: 'between',
        from: 1577836800,
        to: 1609459200,
        scope: 'external',
      }),
    ]);
  });

  it('should resolve equality filters', async () => {
    const result = await resolveExternalFilters(
      createDataviz(),
      [{ property: 'model', value: { value: 'Sedan' } }],
      { templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([
      expect.objectContaining({
        property: 'model',
        propertyType: 'text',
        operator: 'eq',
        value: 'Sedan',
        scope: 'external',
      }),
    ]);
  });

  it('should auto-match when the source has exactly one compatible property', async () => {
    const singleNumericTemplate = {
      id: CARS_TEMPLATE_ID,
      properties: [
        { name: 'colors', type: 'select' },
        { name: 'mileage', type: 'numeric' },
      ],
    };

    const result = await resolveExternalFilters(
      createDataviz(),
      [{ property: 'altura', value: { max: 40 } }],
      { templatesDS: createTemplatesDS([singleNumericTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([
      expect.objectContaining({
        property: 'mileage',
        operator: 'lte',
        to: 40,
      }),
    ]);
  });

  it('should not auto-match when multiple compatible properties exist', async () => {
    const dualNumericTemplate = {
      id: CARS_TEMPLATE_ID,
      properties: [
        { name: 'mileage', type: 'numeric' },
        { name: 'engine_size', type: 'numeric' },
      ],
    };

    const result = await resolveExternalFilters(
      createDataviz(),
      [{ property: 'unknown', value: { max: 10 } }],
      { templatesDS: createTemplatesDS([dualNumericTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([]);
  });

  it('should apply resolved filters to every matching source', async () => {
    const dataviz = createDataviz({
      query: {
        sources: [
          { templateId: CARS_TEMPLATE_ID, alias: 'cars' },
          { templateId: OWNERS_TEMPLATE_ID, alias: 'owners' },
        ],
        dimensions: [{ property: 'country', propertyType: 'select' }],
        measures: [{ aggregation: 'count' }],
      },
      refresh: { refreshMode: 'snapshot_manual' },
    });

    const result = await resolveExternalFilters(
      dataviz,
      [{ property: 'country', value: { values: ['country_ar'] } }],
      {
        templatesDS: createTemplatesDS([
          {
            id: CARS_TEMPLATE_ID,
            properties: [
              { name: 'country', type: 'select', content: 'th_countries' },
              { name: 'mileage', type: 'numeric' },
            ],
          },
          {
            id: OWNERS_TEMPLATE_ID,
            properties: [{ name: 'country', type: 'select', content: 'th_countries' }],
          },
        ]) as TemplatesDataSource,
      }
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceAlias: 'cars',
          property: 'country',
          operator: 'in',
          values: ['country_ar'],
        }),
        expect.objectContaining({
          sourceAlias: 'owners',
          property: 'country',
          operator: 'in',
          values: ['country_ar'],
        }),
      ])
    );
  });

  it('should skip runtime filters without a resolvable value shape', async () => {
    const result = await resolveExternalFilters(
      createDataviz(),
      [{ property: 'mileage', value: {} }],
      { templatesDS: createTemplatesDS([carsTemplate]) as TemplatesDataSource }
    );

    expect(result).toEqual([]);
  });
});

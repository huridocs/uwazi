import type { DatavizFilter, DatavizSource } from '#shared/types/datavizSchema.js';
import { buildFilterMatch, filterAppliesToSource, filtersForSource } from '../buildFilterMatch.js';

describe('buildFilterMatch source scoping', () => {
  const hombresSource: DatavizSource = {
    templateId: 'template-a',
    alias: 'hombres',
  };
  const mujeresSource: DatavizSource = {
    templateId: 'template-a',
    alias: 'mujeres',
  };

  const hombreFilter: DatavizFilter = {
    id: '1',
    sourceAlias: 'hombres',
    property: 'sexo',
    propertyType: 'select',
    operator: 'eq',
    value: 'hombre-id',
  };

  const mujerFilter: DatavizFilter = {
    id: '2',
    sourceAlias: 'mujeres',
    property: 'sexo',
    propertyType: 'select',
    operator: 'eq',
    value: 'mujer-id',
  };

  it('should apply filters only to their source alias', () => {
    expect(filterAppliesToSource(hombreFilter, hombresSource, 0)).toBe(true);
    expect(filterAppliesToSource(hombreFilter, mujeresSource, 1)).toBe(false);
    expect(filterAppliesToSource(mujerFilter, mujeresSource, 1)).toBe(true);
  });

  it('should keep global filters for every source', () => {
    const globalFilter: DatavizFilter = {
      id: '3',
      property: 'published',
      propertyType: 'select',
      operator: 'eq',
      value: 'yes',
    };

    expect(filterAppliesToSource(globalFilter, hombresSource, 0)).toBe(true);
    expect(filterAppliesToSource(globalFilter, mujeresSource, 1)).toBe(true);
  });

  it('should build match only with scoped filters', () => {
    const hombreMatch = buildFilterMatch(
      filtersForSource([hombreFilter, mujerFilter], hombresSource, 0)
    );
    const mujerMatch = buildFilterMatch(
      filtersForSource([hombreFilter, mujerFilter], mujeresSource, 1)
    );

    expect(hombreMatch).toEqual([{ 'metadata.sexo.value': 'hombre-id' }]);
    expect(mujerMatch).toEqual([{ 'metadata.sexo.value': 'mujer-id' }]);
  });

  it('should build negation and multi-value operators', () => {
    const filters: DatavizFilter[] = [
      {
        id: 'ne',
        property: 'colors',
        propertyType: 'select',
        operator: 'ne',
        value: 'red',
      },
      {
        id: 'in',
        property: 'colors',
        propertyType: 'select',
        operator: 'in',
        values: ['red', 'blue'],
      },
      {
        id: 'nin',
        property: 'colors',
        propertyType: 'select',
        operator: 'nin',
        values: ['green'],
      },
    ];

    expect(buildFilterMatch(filters)).toEqual([
      { 'metadata.colors.value': { $ne: 'red' } },
      { 'metadata.colors.value': { $in: ['red', 'blue'] } },
      { 'metadata.colors.value': { $nin: ['green'] } },
    ]);
  });

  it('should coerce numeric bounds from string form values', () => {
    expect(
      buildFilterMatch([
        {
          id: 'lte',
          property: 'engine_size',
          propertyType: 'numeric',
          operator: 'lte',
          to: '4',
        },
        {
          id: 'between',
          property: 'engine_size',
          propertyType: 'numeric',
          operator: 'between',
          from: '2',
          to: '3',
        },
      ])
    ).toEqual([
      { 'metadata.engine_size.value': { $lte: 4 } },
      { 'metadata.engine_size.value': { $gte: 2, $lte: 3 } },
    ]);
  });

  it('should use from and to for gte and lte bounds', () => {
    expect(
      buildFilterMatch([
        {
          id: 'gte',
          property: 'year',
          propertyType: 'date',
          operator: 'gte',
          from: '2020-01-01',
        },
        {
          id: 'lte',
          property: 'year',
          propertyType: 'date',
          operator: 'lte',
          to: '2024-12-31',
        },
      ])
    ).toEqual([
      { 'metadata.year.value': { $gte: '2020-01-01' } },
      { 'metadata.year.value': { $lte: '2024-12-31' } },
    ]);
  });
});

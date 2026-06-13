import type { DatavizFilter, DatavizSource } from '#shared/types/datavizSchema.js';
import {
  buildFilterMatch,
  filterAppliesToSource,
  filtersForSource,
} from '../buildFilterMatch.js';

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
    const hombreMatch = buildFilterMatch(filtersForSource([hombreFilter, mujerFilter], hombresSource, 0));
    const mujerMatch = buildFilterMatch(filtersForSource([hombreFilter, mujerFilter], mujeresSource, 1));

    expect(hombreMatch).toEqual([{ 'metadata.sexo.value': 'hombre-id' }]);
    expect(mujerMatch).toEqual([{ 'metadata.sexo.value': 'mujer-id' }]);
  });
});

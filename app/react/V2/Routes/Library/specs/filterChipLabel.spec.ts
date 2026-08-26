import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { resolveFilterChipParts } from '../filterChipLabel.js';

const templates = [
  {
    _id: 'tpl-case',
    name: 'Case',
    properties: [
      {
        _id: 'prop-country',
        name: 'country',
        label: 'Country',
        type: 'select',
        content: 'th-countries',
      },
    ],
  },
] as Template[];

const thesauri = [
  {
    _id: 'th-countries',
    name: 'Countries',
    values: [
      { id: 'ES', label: 'Spain' },
      {
        id: 'eu',
        label: 'Europe',
        values: [{ id: 'FR', label: 'France' }],
      },
    ],
  },
] as ClientThesaurus[];

const aggregations: LibraryAggregations = {
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: {
    country: [{ id: 'ES', label: 'Spain (agg)', count: 2 }],
  },
};

describe('resolveFilterChipParts', () => {
  it('uses property and value labels instead of names and ids', () => {
    expect(resolveFilterChipParts('country', 'ES', templates, aggregations, thesauri)).toEqual({
      propertyLabel: 'Country',
      propertyContext: 'prop-country',
      valueLabel: 'Spain (agg)',
      translateValue: false,
    });
  });

  it('falls back to the thesaurus label when aggregations have no match', () => {
    expect(resolveFilterChipParts('country', 'FR', templates, undefined, thesauri)).toEqual({
      propertyLabel: 'Country',
      propertyContext: 'prop-country',
      valueLabel: 'France',
      valueContext: 'th-countries',
      translateValue: true,
    });
  });

  it('resolves type and status with their display labels', () => {
    expect(resolveFilterChipParts('type', 'tpl-case', templates)).toEqual({
      propertyLabel: 'Type',
      valueLabel: 'Case',
      valueContext: 'tpl-case',
      translateValue: true,
    });
    expect(resolveFilterChipParts('status', 'restricted', templates)).toEqual({
      propertyLabel: 'Status',
      valueLabel: 'Restricted',
      translateValue: true,
    });
  });
});

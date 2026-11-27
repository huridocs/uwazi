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
    expect(
      resolveFilterChipParts({ key: 'country', value: 'ES', templates, aggregations, thesauri })
    ).toEqual({
      propertyLabel: 'Country',
      propertyContext: 'prop-country',
      valueLabel: 'Spain (agg)',
      translateValue: false,
    });
  });

  it('falls back to the thesaurus label when aggregations have no match', () => {
    expect(resolveFilterChipParts({ key: 'country', value: 'FR', templates, thesauri })).toEqual({
      propertyLabel: 'Country',
      propertyContext: 'prop-country',
      valueLabel: 'France',
      valueContext: 'th-countries',
      translateValue: true,
    });
  });

  it('names a permission chip by level so the same member can appear twice', () => {
    const withPermissions: LibraryAggregations = {
      ...aggregations,
      permissions: {
        read: [{ id: 'user1', label: 'afarah', count: 4, group: false }],
        write: [{ id: 'group1', label: 'Litigation', count: 1, group: true }],
      },
    };
    expect(
      resolveFilterChipParts({
        key: 'permissions.read',
        value: 'user1',
        templates,
        aggregations: withPermissions,
      })
    ).toEqual({
      propertyLabel: 'Can view',
      valueLabel: 'afarah',
      translateValue: false,
    });
    expect(
      resolveFilterChipParts({
        key: 'permissions.write',
        value: 'group1',
        templates,
        aggregations: withPermissions,
      })
    ).toEqual({
      propertyLabel: 'Can edit',
      valueLabel: 'Litigation',
      translateValue: false,
    });
  });

  it('resolves type and status with their display labels', () => {
    expect(resolveFilterChipParts({ key: 'type', value: 'tpl-case', templates })).toEqual({
      propertyLabel: 'Type',
      valueLabel: 'Case',
      valueContext: 'tpl-case',
      translateValue: true,
    });
    expect(resolveFilterChipParts({ key: 'status', value: 'restricted', templates })).toEqual({
      propertyLabel: 'Status',
      valueLabel: 'Restricted',
      translateValue: true,
    });
  });
});

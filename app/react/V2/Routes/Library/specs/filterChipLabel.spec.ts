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

const sharedCountryTemplates = [
  {
    _id: 'tpl-a',
    name: 'A',
    properties: [{ name: 'country', label: 'Country A', type: 'select', content: 'th-a' }],
  },
  {
    _id: 'tpl-b',
    name: 'B',
    properties: [{ name: 'country', label: 'Country B', type: 'select', content: 'th-b' }],
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
    expect(resolveFilterChipParts('country', 'ES', { templates, aggregations, thesauri })).toEqual({
      propertyLabel: 'Country',
      propertyContext: 'tpl-case',
      valueLabel: 'Spain (agg)',
      translateValue: false,
    });
  });

  it('keeps a related record title as plain text', () => {
    const relationshipTemplates = [
      {
        _id: 'tpl-case',
        name: 'Case',
        properties: [
          {
            _id: 'prop-court',
            name: 'court',
            label: 'Court',
            type: 'relationship',
            content: 'tpl-org',
          },
        ],
      },
    ] as Template[];
    const relationshipAggregations: LibraryAggregations = {
      templates: [],
      published: { published: 0, restricted: 0 },
      properties: {
        court: [{ id: 'org-1', label: 'Supreme Court', count: 1 }],
      },
    };
    expect(
      resolveFilterChipParts('court', 'org-1', {
        templates: relationshipTemplates,
        aggregations: relationshipAggregations,
      })
    ).toEqual({
      propertyLabel: 'Court',
      propertyContext: 'tpl-case',
      valueLabel: 'Supreme Court',
      translateValue: false,
    });
  });

  it('falls back to the thesaurus label when aggregations have no match', () => {
    expect(resolveFilterChipParts('country', 'FR', { templates, thesauri })).toEqual({
      propertyLabel: 'Country',
      propertyContext: 'tpl-case',
      valueLabel: 'France',
      valueContext: 'th-countries',
      translateValue: true,
    });
  });

  it('does not pick a template context when the property name is shared', () => {
    expect(
      resolveFilterChipParts('country', 'ES', { templates: sharedCountryTemplates })
    ).toMatchObject({
      propertyLabel: 'country',
      propertyContext: 'country',
    });
  });

  it('uses the property name when selected templates label it differently', () => {
    expect(
      resolveFilterChipParts('country', 'ES', {
        templates: sharedCountryTemplates,
        typeIds: ['tpl-a', 'tpl-b'],
      })
    ).toMatchObject({
      propertyLabel: 'country',
      propertyContext: 'country',
    });
  });

  it('uses the selected template when several templates share the property name', () => {
    expect(
      resolveFilterChipParts('country', 'ES', {
        templates: sharedCountryTemplates,
        typeIds: ['tpl-b'],
      })
    ).toEqual({
      propertyLabel: 'Country B',
      propertyContext: 'tpl-b',
      valueLabel: 'ES',
      valueContext: 'th-b',
      translateValue: false,
    });
  });

  it('resolves a missing property value to the System No Label key before aggregations', () => {
    const withMissing: LibraryAggregations = {
      ...aggregations,
      properties: {
        country: [{ id: 'missing', label: 'No label', count: 2 }],
      },
    };
    expect(
      resolveFilterChipParts('country', 'missing', {
        templates,
        aggregations: withMissing,
        thesauri,
      })
    ).toEqual({
      propertyLabel: 'Country',
      propertyContext: 'tpl-case',
      valueLabel: 'No Label',
      valueContext: 'System',
      translateValue: true,
    });
  });

  it('resolves a missing type value to the System No Label key', () => {
    expect(resolveFilterChipParts('type', 'missing', { templates })).toEqual({
      propertyLabel: 'Type',
      valueLabel: 'No Label',
      valueContext: 'System',
      translateValue: true,
    });
  });

  it('resolves type and status with their display labels', () => {
    expect(resolveFilterChipParts('type', 'tpl-case', { templates })).toEqual({
      propertyLabel: 'Type',
      valueLabel: 'Case',
      valueContext: 'tpl-case',
      translateValue: true,
    });
    expect(resolveFilterChipParts('status', 'restricted', { templates })).toEqual({
      propertyLabel: 'Status',
      valueLabel: 'Restricted',
      translateValue: true,
    });
  });
});

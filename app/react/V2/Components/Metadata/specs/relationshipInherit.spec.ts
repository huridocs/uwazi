import {
  buildInheritColumns,
  inheritColumnLabel,
  relationshipGroupKey,
} from '../relationshipInherit.js';
import type { InheritColumnProperty } from '../relationshipInherit.js';

describe('relationshipGroupKey', () => {
  it('should join content and relationType with a separator', () => {
    expect(relationshipGroupKey({ content: 'tpl', relationType: 'rel' })).toBe('tpl::rel');
    expect(relationshipGroupKey({})).toBe('::');
  });
});

describe('buildInheritColumns', () => {
  const templates = [
    {
      _id: 'target-template',
      properties: [{ _id: 'inherited-prop-id', label: 'Inherited label' }],
    },
  ];

  const metadataProperties: InheritColumnProperty[] = [
    {
      _id: '1',
      type: 'relationship',
      name: 'related',
      label: 'Related',
      content: 'target-template',
      relationType: 'rel1',
    },
    {
      _id: '2',
      type: 'relationship',
      name: 'inherited_tags',
      label: 'Fallback label',
      content: 'target-template',
      relationType: 'rel1',
      inherited: true,
      inherit: { property: 'inherited-prop-id' },
    },
  ];

  it('should resolve the inherited property label from the target template', () => {
    expect(inheritColumnLabel(metadataProperties[1], templates)).toBe('Inherited label');
  });

  it('should build columns for matching inherited relationship properties', () => {
    expect(
      buildInheritColumns(metadataProperties[0], metadataProperties, templates, {
        inherited_tags: [
          {
            value: 'entity-1',
            inheritedValue: [
              {
                label: 'Nested',
                value: null,
              },
            ],
          },
        ],
      })
    ).toEqual([
      {
        label: 'Inherited label',
        cellsByEntityId: { 'entity-1': 'Nested' },
      },
    ]);
  });

  it('should map empty inheritedValue cells to undefined for dash fallback', () => {
    const columns = buildInheritColumns(metadataProperties[0], metadataProperties, templates, {
      inherited_tags: [{ value: 'entity-1' }, { value: 'entity-2', inheritedValue: [] }],
    });
    expect(columns).toHaveLength(1);
    expect(columns[0].label).toBe('Inherited label');
    expect(columns[0].cellsByEntityId).toEqual({
      'entity-1': undefined,
      'entity-2': undefined,
    });
  });

  it('should keep an empty cellsByEntityId when source metadata is missing', () => {
    expect(buildInheritColumns(metadataProperties[0], metadataProperties, templates)).toEqual([
      {
        label: 'Inherited label',
        cellsByEntityId: {},
      },
    ]);
  });

  it('should set inheritedType from inherit.type for visual columns', () => {
    const geoProp: InheritColumnProperty = {
      _id: 'geo-rel',
      type: 'relationship',
      name: 'related_place',
      label: 'Place',
      content: 'place-tmpl',
      relationType: 'rel-geo',
      inherited: true,
      inherit: { property: 'geo-id', type: 'geolocation' },
    };
    const columns = buildInheritColumns(
      geoProp,
      [geoProp],
      [{ _id: 'place-tmpl', properties: [{ _id: 'geo-id', label: 'Geolocation' }] }],
      { related_place: [{ value: 'e1', inheritedValue: [{ value: { lat: 1, lon: 2 } }] }] }
    );
    expect(columns[0]).toMatchObject({ label: 'Geolocation', inheritedType: 'geolocation' });
  });

  it('should resolve inheritTargetTemplateId for inherited relationship columns', () => {
    const relProp: InheritColumnProperty = {
      _id: 'cities-rel',
      type: 'relationship',
      name: 'related_cities',
      label: 'Cities',
      content: 'person-tmpl',
      relationType: 'rel-cities',
      inherited: true,
      inherit: { property: 'cities-prop', type: 'relationship' },
    };
    const columns = buildInheritColumns(
      relProp,
      [relProp],
      [
        {
          _id: 'person-tmpl',
          properties: [{ _id: 'cities-prop', label: 'Cities', content: 'city-tmpl' }],
        },
      ],
      {
        related_cities: [
          {
            value: 'person-1',
            inheritedType: 'relationship',
            inheritedValue: [
              { value: 'city-1', label: 'Quito' },
              { value: 'city-2', label: 'Guayaquil' },
            ],
          },
        ],
      }
    );
    expect(columns[0]).toMatchObject({ label: 'Cities', inheritedType: 'relationship' });
  });

  it('should build N columns for sibling inherits on the same group key', () => {
    const siblings: InheritColumnProperty[] = [
      {
        _id: 'a',
        type: 'relationship',
        name: 'people_country',
        label: 'People involved',
        content: 'person-tmpl',
        relationType: 'people',
        inherited: true,
        inherit: { property: 'country-id' },
      },
      {
        _id: 'b',
        type: 'relationship',
        name: 'people_role',
        label: 'Role',
        content: 'person-tmpl',
        relationType: 'people',
        inherited: true,
        inherit: { property: 'role-id' },
      },
    ];
    const siblingTemplates = [
      {
        _id: 'person-tmpl',
        properties: [
          { _id: 'country-id', label: 'Country' },
          { _id: 'role-id', label: 'Role' },
        ],
      },
    ];

    const columns = buildInheritColumns(siblings[0], siblings, siblingTemplates, {
      people_country: [{ value: 'e1', inheritedValue: [{ value: 'Kenya', label: 'Kenya' }] }],
      people_role: [{ value: 'e1', inheritedValue: [{ value: 'Witness', label: 'Witness' }] }],
    });

    expect(columns.map(column => column.label)).toEqual(['Country', 'Role']);
    expect(columns[0].cellsByEntityId?.e1).toBe('Kenya');
    expect(columns[1].cellsByEntityId?.e1).toBe('Witness');
  });
});

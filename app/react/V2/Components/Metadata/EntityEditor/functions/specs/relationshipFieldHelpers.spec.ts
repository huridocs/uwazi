import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { MultiselectListOption } from '../../../../Forms/index.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import type { DisplayProperty } from '../relationshipGrouping.js';
import {
  buildInheritColumns,
  inheritColumnLabel,
  inheritedCellText,
  mergeRelationshipLookupOptions,
  thesaurusToOptions,
} from '../relationshipFieldHelpers.js';

describe('thesaurusToOptions', () => {
  const thesauri: ClientThesaurus[] = [
    {
      _id: 'thes-1',
      name: 'Status',
      values: [
        { id: 'open', label: 'Open' },
        {
          id: 'group',
          label: 'Group',
          values: [{ id: 'child', label: 'Child' }],
        },
      ],
    },
  ];

  const property: FormMetadataProperty = {
    _id: '1',
    type: 'select',
    name: 'status',
    label: 'Status',
    content: 'thes-1',
  };

  it('should map thesaurus values to multiselect options', () => {
    expect(thesaurusToOptions(thesauri, property)).toEqual([
      { label: 'Open', searchLabel: 'Open', value: 'open', items: undefined },
      {
        label: 'Group',
        searchLabel: 'Group',
        value: 'group',
        items: [{ label: 'Child', searchLabel: 'Child', value: 'child' }],
      },
    ]);
  });

  it('should return an empty list when the thesaurus is missing', () => {
    expect(thesaurusToOptions(thesauri, { ...property, content: 'missing' })).toEqual([]);
  });
});

describe('mergeRelationshipLookupOptions', () => {
  const property: DisplayProperty = {
    _id: '1',
    type: 'relationship',
    name: 'related',
    label: 'Related',
    content: 'tpl',
    relationType: 'rel',
  };

  it('should prefer selected labels and cache merged options', () => {
    const cache = new Map<string, MultiselectListOption[]>();
    const selectedValues: MetadataValue[] = [{ value: 'a', label: 'Alpha' }];
    const lookedUpOptions: MultiselectListOption[] = [
      { label: 'Beta', searchLabel: 'beta', value: 'b' },
      { label: 'Alpha looked up', searchLabel: 'alpha looked up', value: 'a' },
    ];

    const merged = mergeRelationshipLookupOptions({
      property,
      selectedValues,
      lookedUpOptions,
      cache,
    });

    expect(merged).toEqual([
      { label: 'Alpha', searchLabel: 'alpha', value: 'a' },
      { label: 'Beta', searchLabel: 'beta', value: 'b' },
    ]);
    expect(cache.get('tpl::rel')).toEqual(merged);
  });

  it('should skip cache writes when includeCachedOptions is false', () => {
    const cache = new Map<string, MultiselectListOption[]>();
    mergeRelationshipLookupOptions({
      property,
      selectedValues: [],
      lookedUpOptions: [{ label: 'Beta', searchLabel: 'beta', value: 'b' }],
      cache,
      includeCachedOptions: false,
    });
    expect(cache.size).toBe(0);
  });
});

describe('buildInheritColumns', () => {
  const templates = [
    {
      _id: 'target-template',
      properties: [{ _id: 'inherited-prop-id', label: 'Inherited label' }],
    },
  ];

  const metadataProperties: FormMetadataProperty[] = [
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

  const property: DisplayProperty = {
    ...metadataProperties[0],
    groupedRelationshipNames: ['related'],
  };

  it('should prefer inherited value labels when building cell text', () => {
    expect(
      inheritedCellText(
        [
          {
            value: 'entity-1',
            inheritedValue: [{ label: 'Tag A', value: null }, { value: 'raw-b' }],
          },
        ],
        'entity-1'
      )
    ).toBe('Tag A, raw-b');
  });

  it('should resolve the inherited property label from the target template', () => {
    expect(inheritColumnLabel(metadataProperties[1], templates)).toBe('Inherited label');
  });

  it('should build columns for matching inherited relationship properties', () => {
    expect(
      buildInheritColumns(property, metadataProperties, templates, {
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
});

import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import type { MultiselectListOption } from '../../../../Forms/index.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import type { DisplayProperty } from '../relationshipGrouping.js';
import {
  defaultRelationshipLookup,
  mergeRelationshipLookupOptions,
  thesaurusToOptions,
} from '../relationshipFieldHelpers.js';

jest.mock('#V2/api/search/index.js', () => ({
  lookup: jest.fn(),
}));

const { lookup: lookupEntities } = jest.requireMock('#V2/api/search/index.js') as {
  lookup: jest.Mock;
};

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

describe('defaultRelationshipLookup', () => {
  beforeEach(() => {
    lookupEntities.mockReset();
  });

  it('maps search rows to value/label pairs', async () => {
    lookupEntities.mockResolvedValue({
      rows: [
        { sharedId: 'e1', title: 'One' },
        { sharedId: 'e2', title: '' },
      ],
    });

    await expect(defaultRelationshipLookup({ search: 'o', template: 'tpl' })).resolves.toEqual([
      { value: 'e1', label: 'One' },
      { value: 'e2', label: 'e2' },
    ]);
    expect(lookupEntities).toHaveBeenCalledWith({
      entityTitle: 'o',
      template: 'tpl',
      limit: 50,
    });
  });

  it('returns an empty list for unexpected responses', async () => {
    lookupEntities.mockResolvedValue(null);
    await expect(defaultRelationshipLookup({ search: 'x' })).resolves.toEqual([]);
  });
});

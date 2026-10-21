import { createElement } from 'react';
import { Translate } from '#app/I18N/index.js';
import { getStore } from '#shared/atomStore/index.js';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
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

  beforeEach(() => {
    const store = getStore();
    store.set(localeAtom, 'es');
    store.set(translationsAtom, [
      {
        locale: 'es',
        contexts: [
          {
            id: 'thes-1',
            label: 'Status',
            type: 'Thesaurus',
            values: { Open: 'Abierto', Group: 'Grupo', Child: 'Hijo' },
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    const store = getStore();
    store.set(localeAtom, '');
    store.set(translationsAtom, []);
  });

  it('should translate option labels with the thesaurus context', () => {
    const label = (text: string) => createElement(Translate, { context: 'thes-1' }, text);

    expect(thesaurusToOptions(thesauri, property)).toEqual([
      {
        label: label('Open'),
        searchLabel: 'Abierto',
        value: 'open',
        items: undefined,
      },
      {
        label: label('Group'),
        searchLabel: 'Grupo',
        value: 'group',
        items: [
          {
            label: label('Child'),
            searchLabel: 'Hijo',
            value: 'child',
          },
        ],
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

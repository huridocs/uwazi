import { ThesaurusRow } from '../components';
import {
  addSelection,
  sanitizeThesauri,
  sanitizeThesaurusValues,
  thesaurusAsRow,
} from '../helpers';

const thesaurusValues: {}[] = [
  {
    _id: 'originalId1',
    rowId: 'item1',
    subRows: [
      {
        rowId: 'subItem1-1',
        label: 'SubItem1-1',
        groupId: 'item1',
        _id: 'temporalId1',
      },
      {
        rowId: 'subItem1-2',
        label: 'SubItem1-2',
      },
    ],
    label: 'Item1',
    values: [{ id: 'oldItem', label: 'OldItem' }],
  },
  {
    rowId: 'item2',
    id: 'originalId2',
    subRows: [
      {
        rowId: 'subItem2-1',
        label: 'SubItem2-1',
        id: 'originalId2',
      },
      {
        rowId: 'subItem2-2',
        label: 'SubItem2-2',
        groupId: 'item2',
      },
    ],
    label: 'Item2',
    values: [],
  },
];

const sanitizedThesaurusValues: {}[] = [
  {
    _id: 'originalId1',
    values: [
      {
        label: 'SubItem1-1',
        _id: 'temporalId1',
      },
      {
        label: 'SubItem1-2',
      },
    ],
    label: 'Item1',
  },
  {
    id: 'originalId2',
    values: [
      {
        label: 'SubItem2-1',
        id: 'originalId2',
      },
      {
        label: 'SubItem2-2',
      },
    ],
    label: 'Item2',
  },
];

describe('sanitizeThesaurusValues', () => {
  it('should remove table properties', () => {
    const result = sanitizeThesaurusValues(thesaurusValues as ThesaurusRow[]);
    expect(result).toEqual(sanitizedThesaurusValues);
  });
});

describe('addSelection', () => {
  it('should push the item into selection if rowId is selected', () => {
    const selectedRows = { item2: true };
    const selection: ThesaurusRow[] = [];
    addSelection(selectedRows, selection)(thesaurusValues[1]);
    expect(selection).toHaveLength(1);
    expect(selection[0]).toEqual(thesaurusValues[1]);
  });

  it('should not push the item into selection if rowId is not selected ', () => {
    const selectedRows = { item1: false };
    const selection: ThesaurusRow[] = [];
    addSelection(selectedRows, selection)(thesaurusValues[1]);
    expect(selection).toHaveLength(0);
  });
});

describe('sanitizeThesauri', () => {
  it('should remove empty labels', () => {
    const thesaurus = {
      _id: 'thesaurus1',
      name: 'Thesaurus1',
      values: [
        { rowId: 'newId', label: '' },
        {
          rowId: 'value1',
          label: 'Value1',
          values: [
            {
              id: 'value 1-1',
              _id: 'value 1-1',
              label: 'Value 1-1',
            },
            {
              id: 'other',
              label: '',
            },
          ],
        },
      ],
    };
    const sanitizedThesaurus = {
      _id: 'thesaurus1',
      name: 'Thesaurus1',
      values: [
        {
          rowId: 'value1',
          label: 'Value1',
          values: [
            {
              _id: 'value 1-1',
              id: 'value 1-1',
              label: 'Value 1-1',
            },
          ],
        },
      ],
    };
    const result = sanitizeThesauri(thesaurus);
    expect(result).toEqual(sanitizedThesaurus);
  });
});

describe('thesaurusAsRow', () => {
  it('should append a rowId with id for existent items and a new id for the new ones', () => {
    const thesaurus = {
      _id: 'old_Id',
      id: 'oldId',
      label: 'label1',
      values: [
        {
          id: 'item1-1',
          label: 'Item1-1',
        },
        {
          label: 'new1-2',
        },
      ],
    };
    const result = thesaurusAsRow(thesaurus);
    expect(result).toEqual({
      _id: 'old_Id',
      id: 'oldId',
      rowId: 'oldId',
      label: 'label1',
      subRows: [
        {
          id: 'item1-1',
          label: 'Item1-1',
          rowId: 'item1-1',
          groupId: 'oldId',
        },
        {
          rowId: expect.any(String),
          label: 'new1-2',
          groupId: 'oldId',
        },
      ],
    });
  });

  it('should accept an empty thesaurus', () => {
    const thesaurus = {
      label: 'label1',
    };
    const result = thesaurusAsRow(thesaurus);
    expect(result).toEqual({
      rowId: expect.any(String),
      label: 'label1',
    });
  });
});

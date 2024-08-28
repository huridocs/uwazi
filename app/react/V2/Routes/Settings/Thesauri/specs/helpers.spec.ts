import { ThesaurusRow } from '../components';
import {
  addGroupSubmit,
  addItemSubmit,
  addSelection,
  compareThesaurus,
  removeItem,
  sanitizeThesauri,
  sanitizeThesaurusValues,
  sortValues,
  thesaurusAsRow,
} from '../helpers';

const thesaurusValues: ThesaurusRow[] = [
  {
    _id: 'originalId1',
    rowId: 'item1',
    subRows: [
      {
        rowId: 'subItem1-1',
        label: 'SubItem1-1',
        groupId: 'item1',
        //@ts-ignore Keeping _id to ensure legacy compatibility. See #4053
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
    //@ts-ignore, reusing type, it is expected that the original object to contain values
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

describe('removeItem', () => {
  let prev: ThesaurusRow[];

  beforeEach(() => {
    prev = [
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [
          { rowId: 'prevChild1', label: 'Prev Child 1' },
          { rowId: 'prevChild2', label: 'Prev Child 2' },
        ],
      },
      { rowId: 'prevItem2', label: 'Prev Item 2' },
      { rowId: 'prevItem3', label: 'Prev Item 3' },
    ];
  });

  it('should delete a root item', () => {
    const prevCopy = prev;
    removeItem(prevCopy, { rowId: 'prevItem2', label: 'Prev Item 2' });
    expect(prevCopy).toEqual([
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [
          { rowId: 'prevChild1', label: 'Prev Child 1' },
          { rowId: 'prevChild2', label: 'Prev Child 2' },
        ],
      },
      { rowId: 'prevItem3', label: 'Prev Item 3' },
    ]);
  });

  it('should delete a child item', () => {
    const prevCopy = prev;
    removeItem(prevCopy, { rowId: 'prevChild1', label: 'Prev Child 1' });
    expect(prevCopy).toEqual([
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [{ rowId: 'prevChild2', label: 'Prev Child 2' }],
      },
      { rowId: 'prevItem2', label: 'Prev Item 2' },
      { rowId: 'prevItem3', label: 'Prev Item 3' },
    ]);
  });

  it('should delete a group if all the items are deleted', () => {
    const prevCopy = prev;
    removeItem(prevCopy, { rowId: 'prevChild1', label: 'Prev Child 1' });
    removeItem(prevCopy, { rowId: 'prevChild2', label: 'Prev Child 2' });
    expect(prevCopy).toEqual([
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      { rowId: 'prevItem2', label: 'Prev Item 2' },
      { rowId: 'prevItem3', label: 'Prev Item 3' },
    ]);
  });
});

describe('sortValues', () => {
  it('should sort alphabetically the thesaurus values', () => {
    const setThesaurusValues = jest.fn();
    const valuesToSort = [
      { rowId: 't1', label: 'Last item' },
      {
        rowId: 't2',
        label: 'Group',
        subRows: [
          { rowId: 'c1', label: 'Last Child' },
          { rowId: 'c2', label: 'First Child' },
        ],
      },
      { rowId: 't3', label: 'First item' },
    ];
    sortValues(valuesToSort, setThesaurusValues)();
    expect(setThesaurusValues).toHaveBeenCalledWith([
      { rowId: 't3', label: 'First item' },
      {
        rowId: 't2',
        label: 'Group',
        subRows: [
          { rowId: 'c2', label: 'First Child' },
          { rowId: 'c1', label: 'Last Child' },
        ],
      },
      { rowId: 't1', label: 'Last item' },
    ]);
  });
});

describe('addItemSubmit', () => {
  let prev: ThesaurusRow[];

  beforeEach(() => {
    prev = [
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [{ rowId: 'prevChild1', label: 'Prev Child 1' }],
      },
    ];
  });

  let result: ThesaurusRow[];

  it('should add new root items', () => {
    const items = [
      { rowId: 'newItem2', label: 'New Item2' },
      { rowId: 'newItem3', label: 'New Item3' },
    ];
    const setThesaurusValues = jest.fn().mockImplementation(fn => {
      result = fn(prev);
    });
    addItemSubmit(prev, setThesaurusValues)(items);
    expect(result).toEqual([
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [{ rowId: 'prevChild1', label: 'Prev Child 1' }],
      },
      { rowId: 'newItem2', label: 'New Item2' },
      { rowId: 'newItem3', label: 'New Item3' },
    ]);
  });
  it('should edit a root item', () => {
    const items = [{ rowId: 'prevItem1', label: 'Changed Item 1' }];
    const setThesaurusValues = jest.fn();
    addItemSubmit(prev, setThesaurusValues)(items);
    expect(setThesaurusValues).toHaveBeenCalledWith([
      { rowId: 'prevItem1', label: 'Changed Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [{ rowId: 'prevChild1', label: 'Prev Child 1' }],
      },
    ]);
  });
  it('should add items into a group', () => {
    const items = [{ rowId: 'newItem2', label: 'New Item2', groupId: 'prevGroup1' }];
    const setThesaurusValues = jest.fn().mockImplementation(fn => {
      result = fn(prev);
    });
    addItemSubmit(prev, setThesaurusValues)(items);
    expect(result).toEqual([
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [
          { rowId: 'prevChild1', label: 'Prev Child 1' },
          { rowId: 'newItem2', label: 'New Item2' },
        ],
      },
    ]);
  });
});
describe('addGroupSubmit', () => {
  let prev: ThesaurusRow[];

  beforeEach(() => {
    prev = [
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [{ rowId: 'prevChild1', label: 'Prev Child 1' }],
      },
    ];
  });
  let result: ThesaurusRow[];
  const setThesaurusValues = jest.fn().mockImplementation(fn => {
    result = fn(prev);
  });

  it('should add a new group', () => {
    const group = {
      rowId: 'newGroup2',
      label: 'New Group2',
      subRows: [{ rowId: 'newChild2', label: 'New Child 2', groupId: 'newGroup2' }],
    };
    addGroupSubmit(prev, setThesaurusValues)(group);
    expect(result).toEqual([
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Prev Group1',
        subRows: [{ rowId: 'prevChild1', label: 'Prev Child 1' }],
      },
      {
        rowId: 'newGroup2',
        label: 'New Group2',
        subRows: [{ rowId: 'newChild2', label: 'New Child 2' }],
      },
    ]);
  });
  it('should add items to an existent group', () => {
    const group = {
      rowId: 'prevGroup1',
      label: 'Updated Group1',
      subRows: [
        { rowId: 'prevChild1', label: 'Prev Child 1', groupId: 'prevGroup1' },
        { rowId: 'newChild1', label: 'New Child 1', groupId: 'prevGroup1' },
      ],
    };
    addGroupSubmit(prev, setThesaurusValues)(group);
    expect(result).toEqual([
      { rowId: 'prevItem1', label: 'Prev Item 1' },
      {
        rowId: 'prevGroup1',
        label: 'Updated Group1',
        subRows: [
          { rowId: 'prevChild1', label: 'Prev Child 1' },
          { rowId: 'newChild1', label: 'New Child 1' },
        ],
      },
    ]);
  });
});

describe('compareThesaurus', () => {
  const originalThesaurus = {
    _id: 't1',
    name: 'Original Name',
    values: [{ id: 'v1', label: 'Value 1' }],
  };
  it('should return true if the values are the same', () => {
    const result = compareThesaurus(originalThesaurus, { ...originalThesaurus });
    expect(result).toEqual(false);
  });
  it('should return false if the name has changed', () => {
    const newThesaurus = {
      _id: 't1',
      name: 'New Name',
      values: [{ id: 'v1', label: 'Value 1' }],
    };
    const result = compareThesaurus(originalThesaurus, newThesaurus);
    expect(result).toEqual(true);
  });
  it('should return false if a value has changed', () => {
    const newThesaurus = {
      _id: 't1',
      name: 'Original Name',
      values: [{ id: 'v1', label: 'New Value 1' }],
    };
    const result = compareThesaurus(originalThesaurus, newThesaurus);
    expect(result).toEqual(true);
  });
  it('should return false if there is a new value', () => {
    const newThesaurus = {
      _id: 't1',
      name: 'Original Name',
      values: [{ id: 'v1', label: 'Value 1' }, { label: 'Value 2' }],
    };
    const result = compareThesaurus(originalThesaurus, newThesaurus);
    expect(result).toEqual(true);
  });
});

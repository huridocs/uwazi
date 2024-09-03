/* eslint-disable max-statements */
import { UniqueIdentifier } from '@dnd-kit/core';
import { getRowIds, dndSortHandler } from '../helpers';
import { tableData } from './fixtures';

describe('row id generator', () => {
  it('should return a flat array of row ids with the correct format', () => {
    const ids = getRowIds(tableData);
    expect(ids).toEqual([
      { id: '1' },
      { id: '1.1', parentId: '1' },
      { id: '1.2', parentId: '1' },
      { id: '1.3', parentId: '1' },
      { id: '2' },
      { id: 'A', parentId: '2' },
      { id: 'B', parentId: '2' },
      { id: '3' },
      { id: 'C', parentId: '3' },
      { id: 'D', parentId: '3' },
      { id: '4' },
      { id: '4-dropzone', parentId: '4' },
      { id: '5' },
      { id: '6' },
    ]);
  });
});

describe('DnD table sort handler', () => {
  let ids: { id: UniqueIdentifier; parentId?: string }[] = [];

  beforeAll(() => {
    ids = getRowIds(tableData);
  });

  // eslint-disable-next-line max-statements
  it('should sort root items', () => {
    let result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '4',
      overId: '6',
    });

    expect(result[3].title).toEqual('Item 1');
    expect(result[4].title).toEqual('Item 2');
    expect(result[5].title).toEqual('Group 4');

    result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '1',
      overId: '3',
    });

    expect(result[0].title).toEqual('Group 2');
    expect(result[1].title).toEqual('Group 3');
    expect(result[2].title).toEqual('Group 1');

    result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '5',
      overId: '3',
    });

    expect(result[2].title).toEqual('Item 1');
    expect(result[3].title).toEqual('Group 3');
    expect(result[4].title).toEqual('Group 4');

    result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '6',
      overId: '1',
    });

    expect(result[0].title).toEqual('Item 2');
    expect(result[1].title).toEqual('Group 1');

    result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '1',
      overId: '6',
    });

    expect(result[4].title).toEqual('Item 2');
    expect(result[5].title).toEqual('Group 1');
  });

  it('should sort childring within the parent', () => {
    const [firstElement, rest] = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '1.1',
      overId: '1.2',
    });

    expect(firstElement).toEqual({
      rowId: '1',
      title: 'Group 1',
      created: 10,
      description: 'First group',
      subRows: [
        {
          rowId: '1.2',
          title: 'Sub 1-2',
          description: 'Second child',
          created: 7,
        },
        {
          rowId: '1.1',
          title: 'Sub 1-1',
          description: 'First child',
          created: 5,
        },
        {
          rowId: '1.3',
          title: 'Sub 1-3',
          description: 'Last child',
          created: 9,
        },
      ],
    });

    const [, expected] = tableData;
    expect(rest).toEqual(expected);

    const result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: 'D',
      overId: 'C',
    });

    expect(result[2]).toEqual({
      rowId: '3',
      title: 'Group 3',
      created: 30,
      description: 'Third group',
      subRows: [
        {
          rowId: 'D',
          title: 'Sub 3-2',
          description: 'Second item',
          created: 18,
        },
        {
          rowId: 'C',
          title: 'Sub 3-1',
          description: 'First item',
          created: 12,
        },
      ],
    });
  });

  it('should move childring from one parent to another', () => {
    const result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: 'A',
      overId: 'C',
    });

    expect(result[1]).toEqual({
      rowId: '2',
      title: 'Group 2',
      created: 20,
      description: 'Second group',
      subRows: [
        {
          rowId: 'B',
          title: 'Sub 2-2',
          description: 'Second sub',
          created: 15,
        },
      ],
    });

    expect(result[2]).toEqual({
      rowId: '3',
      title: 'Group 3',
      created: 30,
      description: 'Third group',
      subRows: [
        {
          rowId: 'A',
          title: 'Sub 2-1',
          description: 'First sub',
          created: 10,
        },
        {
          rowId: 'C',
          title: 'Sub 3-1',
          description: 'First item',
          created: 12,
        },
        {
          rowId: 'D',
          title: 'Sub 3-2',
          description: 'Second item',
          created: 18,
        },
      ],
    });
  });

  it('should move a child out of the parent', () => {
    const result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '1.3',
      overId: '5',
    });

    expect(result[0]).toEqual({
      rowId: '1',
      title: 'Group 1',
      created: 10,
      description: 'First group',
      subRows: [
        {
          rowId: '1.1',
          title: 'Sub 1-1',
          description: 'First child',
          created: 5,
        },
        {
          rowId: '1.2',
          title: 'Sub 1-2',
          description: 'Second child',
          created: 7,
        },
      ],
    });

    expect(result[3].title).toEqual('Group 4');

    expect(result[4]).toEqual({
      rowId: '1.3',
      title: 'Sub 1-3',
      description: 'Last child',
      created: 9,
    });

    expect(result[5].title).toEqual('Item 1');
  });

  it('should not move parent items inside other parent items when droping it on parents', () => {
    let result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '4',
      overId: '3',
    });
    result = dndSortHandler({
      currentState: result,
      dataIds: ids,
      activeId: '4',
      overId: '2',
    });
    result = dndSortHandler({
      currentState: result,
      dataIds: ids,
      activeId: '1',
      overId: '4',
    });
    expect(result[0].title).toEqual('Group 4');
    expect(result[1].title).toEqual('Group 1');
  });

  it('should not move parent items inside other parent items when droping it on children', () => {
    const result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '4',
      overId: 'C',
    });
    expect(result).toEqual(tableData);
  });

  it('should move a root item inside a parent', () => {
    const result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '6',
      overId: 'D',
    });

    expect(result.find(item => item.rowId === '6')).toEqual(undefined);
    expect(result[2]).toEqual({
      rowId: '3',
      title: 'Group 3',
      created: 30,
      description: 'Third group',
      subRows: [
        {
          rowId: 'C',
          title: 'Sub 3-1',
          description: 'First item',
          created: 12,
        },
        {
          rowId: '6',
          title: 'Item 2',
          created: 60,
          description: 'Another regular',
        },
        {
          rowId: 'D',
          title: 'Sub 3-2',
          description: 'Second item',
          created: 18,
        },
      ],
    });
  });

  it('should not move a children inside a parent when dropping it on the parent', () => {
    const result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '6',
      overId: '1',
    });
    expect(result[0].title).toEqual('Item 2');
    expect(result[1]).toEqual({
      rowId: '1',
      title: 'Group 1',
      created: 10,
      description: 'First group',
      subRows: [
        {
          rowId: '1.1',
          title: 'Sub 1-1',
          description: 'First child',
          created: 5,
        },
        {
          rowId: '1.2',
          title: 'Sub 1-2',
          description: 'Second child',
          created: 7,
        },
        {
          rowId: '1.3',
          title: 'Sub 1-3',
          description: 'Last child',
          created: 9,
        },
      ],
    });
  });

  it('should move an item withing a parent when dropped on the dropzone', () => {
    const result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '6',
      overId: '4-dropzone',
    });
    expect(result[3]).toEqual({
      rowId: '4',
      title: 'Group 4',
      created: 40,
      description: 'Empty subrows',
      subRows: [
        {
          rowId: '6',
          title: 'Item 2',
          created: 60,
          description: 'Another regular',
        },
      ],
    });
  });

  it('should empty a group by moving all items out of it', () => {
    let result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: 'C',
      overId: '6',
    });
    result = dndSortHandler({
      currentState: result,
      dataIds: ids,
      activeId: 'D',
      overId: '6',
    });
    expect(result[2]).toEqual({
      rowId: '3',
      title: 'Group 3',
      created: 30,
      description: 'Third group',
      subRows: [],
    });
  });

  it('should not allow removing or adding items in groups when disabled', () => {
    let result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '1.1',
      overId: '1',
      disableEditingGroups: true,
    });
    expect(result).toEqual(tableData);

    result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '1.1',
      overId: 'B',
      disableEditingGroups: true,
    });
    expect(result).toEqual(tableData);

    result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '4',
      overId: 'C',
      disableEditingGroups: true,
    });
    expect(result).toEqual(tableData);
  });

  it('should allow sorting within groups and sorting root items when editing groups is disabled', () => {
    let result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '1.1',
      overId: '1.2',
      disableEditingGroups: true,
    });
    expect(result[0]).toEqual({
      ...tableData[0],
      subRows: [
        {
          rowId: '1.2',
          title: 'Sub 1-2',
          description: 'Second child',
          created: 7,
        },
        {
          rowId: '1.1',
          title: 'Sub 1-1',
          description: 'First child',
          created: 5,
        },

        {
          rowId: '1.3',
          title: 'Sub 1-3',
          description: 'Last child',
          created: 9,
        },
      ],
    });

    result = dndSortHandler({
      currentState: tableData,
      dataIds: ids,
      activeId: '6',
      overId: '1',
      disableEditingGroups: true,
    });
    expect(result[0]).toEqual(tableData[5]);
    expect(result[1]).toEqual(tableData[0]);
  });
});

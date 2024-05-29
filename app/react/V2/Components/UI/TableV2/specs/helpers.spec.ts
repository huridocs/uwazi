import { dndSortHandler, getDataIds } from '../helpers';
import { tableData } from './fixtures';

describe('DnD table sort handler', () => {
  // eslint-disable-next-line max-statements
  it('should sort root items', () => {
    const ids = getDataIds(tableData);
    let result = dndSortHandler(tableData, ids, '4', '6');

    expect(result[3].title).toEqual('Item 1');
    expect(result[4].title).toEqual('Item 2');
    expect(result[5].title).toEqual('Group 4');

    result = dndSortHandler(tableData, ids, '1', '3');

    expect(result[0].title).toEqual('Group 2');
    expect(result[1].title).toEqual('Group 3');
    expect(result[2].title).toEqual('Group 1');

    result = dndSortHandler(tableData, ids, '5', '3');

    expect(result[2].title).toEqual('Item 1');
    expect(result[3].title).toEqual('Group 3');
    expect(result[4].title).toEqual('Group 4');

    result = dndSortHandler(tableData, ids, '6', '1');

    expect(result[0].title).toEqual('Item 2');
    expect(result[1].title).toEqual('Group 1');

    result = dndSortHandler(tableData, ids, '1', '6');

    expect(result[4].title).toEqual('Item 2');
    expect(result[5].title).toEqual('Group 1');
  });

  it('should sort childring within the parent', () => {});

  it('should move a child out of the parent', () => {});

  it('should move a root item into a parent item', () => {});

  it('should not move parent items into other parent items', () => {});
});

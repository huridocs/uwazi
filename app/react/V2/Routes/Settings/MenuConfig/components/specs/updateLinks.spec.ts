import { cloneDeep } from 'lodash';
import { updateLinks } from '../MenuForm';
import { links } from './fixtures';
import { Link } from '../../MenuConfig';

describe('updateLinks', () => {
  let existinglinks: Link[] = [];

  beforeEach(() => {
    existinglinks = cloneDeep(links);
  });

  it('should add a new root item', () => {
    let result = updateLinks({ rowId: 'NEW_ITEM', title: 'new', type: 'link' }, existinglinks);
    expect(result).toEqual([
      ...links,
      { rowId: expect.stringMatching('tmp'), title: 'new', type: 'link' },
    ]);

    result = updateLinks({ rowId: 'NEW_ITEM', title: 'new', type: 'link' }, []);
    expect(result).toEqual([{ rowId: expect.stringMatching('tmp'), title: 'new', type: 'link' }]);

    result = updateLinks({ rowId: 'NEW_ITEM', title: 'group', type: 'group' }, []);
    expect(result).toEqual([
      { rowId: expect.stringMatching('tmp'), title: 'group', type: 'group' },
    ]);
  });

  it('should add an item into a group', () => {
    const result = updateLinks(
      { rowId: 'NEW_ITEM', title: 'newsubitem', type: 'link', select: 'group2' },
      existinglinks
    );

    expect(result && result[3].subRows).toEqual([
      {
        title: 'sublink2',
        type: 'link',
        url: 'sublink2.com',
        rowId: 'sublink2-group2',
      },
      {
        title: 'sublink1',
        type: 'link',
        url: 'sublink.com',
        rowId: 'sublink1-group2',
      },
      { rowId: expect.stringMatching('tmp'), title: 'newsubitem', type: 'link' },
    ]);
  });

  it('should move an item from the root to a group', () => {
    const editedLink = { ...existinglinks[0] };
    const result = updateLinks({ ...editedLink, select: 'group1' }, existinglinks);
    expect(result && result[0]._id).toEqual('link2');
    expect(result && result[1].subRows).toEqual([editedLink]);
  });

  it('should move an item from a group to the root', () => {
    const editedLink = {
      title: 'sublink2',
      type: 'link' as 'link',
      url: 'sublink2.com',
      rowId: 'sublink2-group2',
    };

    const result = updateLinks({ ...editedLink }, existinglinks, 'group2');
    expect(result && result[3].subRows).toEqual([
      {
        title: 'sublink1',
        type: 'link',
        url: 'sublink.com',
        rowId: 'sublink1-group2',
      },
    ]);
    expect(result && result[4]).toEqual(editedLink);
  });

  it('should move an item from one group to another', () => {
    const editedLink = {
      title: 'sublink2',
      type: 'link' as 'link',
      url: 'sublink2.com',
      rowId: 'sublink2-group2',
    };
    const result = updateLinks({ ...editedLink, select: 'group1' }, existinglinks, 'group2');
    expect(result && result[3].subRows).toEqual([
      {
        title: 'sublink1',
        type: 'link',
        url: 'sublink.com',
        rowId: 'sublink1-group2',
      },
    ]);
    expect(result && result[2].subRows).toEqual([editedLink]);
  });

  it('should edit items', () => {
    let result = updateLinks({ ...existinglinks[0], title: 'new title' }, existinglinks);
    expect(result && result[0]).toEqual({ ...existinglinks[0], title: 'new title' });
    result = updateLinks({ ...existinglinks[2], title: 'edited group' }, existinglinks);
    expect(result && result[2]).toEqual({ ...existinglinks[2], title: 'edited group' });
    result = updateLinks(
      {
        title: 'sublink2 edited',
        type: 'link',
        url: 'sublink2.com',
        rowId: 'sublink2-group2',
        select: 'group2',
      },
      existinglinks,
      'group2'
    );
    expect(result && result[3].subRows && result[3].subRows).toEqual([
      {
        title: 'sublink2 edited',
        type: 'link',
        url: 'sublink2.com',
        rowId: 'sublink2-group2',
      },
      {
        title: 'sublink1',
        type: 'link',
        url: 'sublink.com',
        rowId: 'sublink1-group2',
      },
    ]);
  });
});

import { formatMenuLinks, sanitizeIds } from '../shared.js';

describe('formatMenuLinks', () => {
  it('should use id as rowId and drop leftover mongoose _id', () => {
    expect(
      formatMenuLinks([
        {
          _id: 'subdoc1',
          id: 'menu1',
          title: 'Home',
          type: 'link',
          url: '/',
        },
      ])
    ).toEqual([
      {
        id: 'menu1',
        title: 'Home',
        type: 'link',
        url: '/',
        rowId: 'menu1',
      },
    ]);
  });

  it('should use sublink id as subRow rowId and group id as the group rowId', () => {
    expect(
      formatMenuLinks([
        {
          _id: 'group-subdoc',
          id: 'group1',
          title: 'Group',
          type: 'group',
          sublinks: [
            {
              _id: 'child-subdoc',
              id: 'sub1',
              title: 'Child',
              type: 'link',
              url: '/child',
            },
          ],
        },
      ])
    ).toEqual([
      {
        id: 'group1',
        title: 'Group',
        type: 'group',
        rowId: 'group1',
        subRows: [
          {
            id: 'sub1',
            title: 'Child',
            type: 'link',
            url: '/child',
            rowId: 'sub1',
          },
        ],
      },
    ]);
  });
});

describe('sanitizeIds', () => {
  it('should strip leftover mongoose _id and table rowId', () => {
    expect(
      sanitizeIds({
        id: 'menu1',
        _id: 'subdoc1',
        title: 'Home',
        type: 'link',
        url: '/',
        rowId: 'menu1',
      })
    ).toEqual({
      id: 'menu1',
      title: 'Home',
      type: 'link',
      url: '/',
    });
  });

  it('should drop a temporary id so the server can mint identity', () => {
    expect(
      sanitizeIds({
        id: 'tmp_new',
        title: 'Home',
        type: 'link',
        url: '/',
        rowId: 'tmp_new',
      })
    ).toEqual({
      title: 'Home',
      type: 'link',
      url: '/',
    });
  });

  it('should map subRows to sublinks and strip leftover _id', () => {
    expect(
      sanitizeIds({
        id: 'group1',
        _id: 'group-subdoc',
        title: 'Group',
        type: 'group',
        rowId: 'group1',
        subRows: [
          {
            id: 'sub1',
            _id: 'child-subdoc',
            title: 'Child',
            type: 'link',
            url: '/child',
            rowId: 'sub1',
          },
        ],
      })
    ).toEqual({
      id: 'group1',
      title: 'Group',
      type: 'group',
      sublinks: [
        {
          id: 'sub1',
          title: 'Child',
          type: 'link',
          url: '/child',
        },
      ],
    });
  });
});

import { toPersistableMenuItems, toReadableMenuItems } from '../menuItems.js';

const generateId = () => 'generated-id';

describe('toReadableMenuItems', () => {
  it('should lift leftover mongoose _id onto id and drop _id', () => {
    expect(toReadableMenuItems([{ _id: 'abc', title: 'Home', type: 'link', url: '/' }])).toEqual([
      { id: 'abc', title: 'Home', type: 'link', url: '/' },
    ]);
  });

  it('should keep an existing id and drop leftover _id', () => {
    expect(
      toReadableMenuItems([{ id: 'keep', _id: 'noise', title: 'Home', type: 'link', url: '/' }])
    ).toEqual([{ id: 'keep', title: 'Home', type: 'link', url: '/' }]);
  });

  it('should lift nested sublink _id onto id', () => {
    expect(
      toReadableMenuItems([
        {
          _id: 'group1',
          title: 'Group',
          type: 'group',
          sublinks: [{ _id: 'sub1', title: 'Child', type: 'link', url: '/child' }],
        },
      ])
    ).toEqual([
      {
        id: 'group1',
        title: 'Group',
        type: 'group',
        sublinks: [{ id: 'sub1', title: 'Child', type: 'link', url: '/child' }],
      },
    ]);
  });

  it('should not mint an id when neither id nor _id is present', () => {
    expect(toReadableMenuItems([{ title: 'Home', type: 'link', url: '/' }])).toEqual([
      { title: 'Home', type: 'link', url: '/' },
    ]);
  });
});

describe('toPersistableMenuItems', () => {
  it('should assign id for new items and not mint mongoose _id', () => {
    expect(toPersistableMenuItems([{ title: 'Home', type: 'link', url: '/' }], generateId)).toEqual(
      [{ id: 'generated-id', title: 'Home', type: 'link', url: '/' }]
    );
  });

  it('should preserve existing id and drop leftover _id', () => {
    expect(
      toPersistableMenuItems(
        [{ id: 'keep', _id: 'noise', title: 'Home', type: 'link', url: '/' }],
        generateId
      )
    ).toEqual([{ id: 'keep', title: 'Home', type: 'link', url: '/' }]);
  });

  it('should lift leftover _id onto id for items and sublinks', () => {
    expect(
      toPersistableMenuItems(
        [
          {
            _id: 'group1',
            title: 'Group',
            type: 'group',
            sublinks: [{ _id: 'sub1', title: 'Child', type: 'link', url: '/child' }],
          },
        ],
        generateId
      )
    ).toEqual([
      {
        id: 'group1',
        title: 'Group',
        type: 'group',
        sublinks: [{ id: 'sub1', title: 'Child', type: 'link', url: '/child' }],
      },
    ]);
  });
});

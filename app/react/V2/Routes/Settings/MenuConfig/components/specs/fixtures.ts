import { Link } from '../../MenuConfig';

const links: Link[] = [
  {
    _id: 'link1',
    title: 'Root link 1',
    type: 'link',
    url: 'root.com',
    rowId: 'link1',
  },
  {
    _id: 'link2',
    title: 'Root link 2',
    type: 'link',
    url: 'root2.com',
    rowId: 'link2',
  },
  {
    _id: 'group1',
    title: 'Empty group',
    type: 'group',
    url: '',
    rowId: 'group1',
    subRows: [],
  },
  {
    _id: 'group2',
    title: 'Group',
    type: 'group',
    url: '',
    rowId: 'group2',
    subRows: [
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
    ],
  },
];

export { links };

type BasicData = {
  rowId: string;
  title: string;
  created: number;
  description: string;
};

type DataWithGroups = BasicData & {
  subRows?: { rowId: string; title: string; description: string; created: number }[];
};

const basicData: BasicData[] = [
  { rowId: 'A2', title: 'Entity 2', created: 2, description: 'Short text' },
  {
    rowId: 'A1',
    title: 'Entity 1',
    created: 1,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
  },
  {
    rowId: 'A4',
    title: 'Entity 4',
    created: 4,
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
  {
    rowId: 'A3',
    title: 'Entity 3',
    created: 3,
    description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
  },
  {
    rowId: 'A5',
    title: 'Entity 5',
    created: 5,
    description:
      'Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo.',
  },
];

const dataWithGroups: DataWithGroups[] = [
  {
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
  },
  {
    rowId: '2',
    title: 'Group 2',
    created: 20,
    description: 'Second group',
    subRows: [
      {
        rowId: '2.1',
        title: 'Sub 2-1',
        description: 'First sub',
        created: 10,
      },
      {
        rowId: '2.2',
        title: 'Sub 2-2',
        description: 'Second sub',
        created: 15,
      },
    ],
  },
  {
    rowId: '3',
    title: 'Group 3',
    created: 30,
    description: 'Third group',
    subRows: [
      {
        rowId: '3.1',
        title: 'Sub 3-1',
        description: 'First item',
        created: 12,
      },
      {
        rowId: '3.2',
        title: 'Sub 3-2',
        description: 'Second item',
        created: 18,
      },
    ],
  },
  {
    rowId: '4',
    title: 'Group 4',
    created: 40,
    description: 'Empty subrows',
    subRows: [],
  },
  {
    rowId: '5',
    title: 'Item 1',
    created: 50,
    description: 'Regular item with no groups',
  },
  {
    rowId: '6',
    title: 'Item 2',
    created: 60,
    description: 'Another regular',
  },
];

export { basicData, dataWithGroups };
export type { BasicData, DataWithGroups };

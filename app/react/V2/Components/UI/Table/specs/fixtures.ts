import { TableProps } from '../Table';

type BasicData = {
  rowId: string;
  title: string;
  created: number;
  description: string;
  disableRowSelection?: boolean;
};

type DataWithGroups = BasicData & {
  subRows?: {
    rowId: string;
    title: string;
    description: string;
    created: number;
    disableRowSelection?: boolean;
  }[];
};

const tableData: TableProps<DataWithGroups>['data'] = [
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
      {
        rowId: '1.3',
        title: 'Sub 1-3',
        description: 'Last child',
        created: 9,
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
        rowId: 'A',
        title: 'Sub 2-1',
        description: 'First sub',
        created: 10,
      },
      {
        rowId: 'B',
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

const tableWithDisabled: TableProps<DataWithGroups>['data'] = [
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
        disableRowSelection: true,
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
        description: 'First child',
        disableRowSelection: true,
        created: 50,
      },
      {
        rowId: '2.2',
        title: 'Sub 2-2',
        description: 'Second child',
        disableRowSelection: true,
        created: 7,
      },
    ],
  },
  {
    rowId: '5',
    title: 'Item 1',
    created: 50,
    disableRowSelection: true,
    description: 'Regular item with no groups',
  },
  {
    rowId: '6',
    title: 'Item 2',
    created: 60,
    description: 'Another regular',
  },
];

export { tableData, tableWithDisabled };

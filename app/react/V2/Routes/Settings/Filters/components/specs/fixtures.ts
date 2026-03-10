import { Filter } from '../helpers';

const templates = [
  {
    _id: 'id1',
    name: 'Template 1',
    properties: [],
  },
  {
    _id: 'id2',
    name: 'Template 2',
    properties: [],
  },
  {
    _id: 'id3',
    name: 'Template 3',
    properties: [],
  },
  {
    _id: 'id4',
    name: 'Template 4',
    properties: [],
  },
];

const filters: Filter[] = [
  {
    id: 'randomGroupId',
    _id: '1',
    rowId: '1',
    name: 'Group 1',
    subRows: [
      {
        id: 'template_id2',
        rowId: 'template_id2',
        name: 'Template 2',
      },
      {
        id: 'template_id3',
        rowId: 'template_id3',
        name: 'Template 3',
      },
    ],
  },
  {
    id: 'template_id1',
    _id: '2',
    rowId: '2',
    name: 'Template 1',
  },
  {
    id: 'randomGroupId2',
    _id: '4',
    rowId: '4',
    name: 'Group 2',
    subRows: [
      {
        id: 'template_id5',
        rowId: 'template_id5',
        name: 'Template 5',
      },
    ],
  },
  {
    id: 'template_id4',
    _id: '3',
    rowId: '3',
    name: 'Template 4',
  },
];

export { templates, filters };

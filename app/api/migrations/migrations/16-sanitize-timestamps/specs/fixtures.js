/** @format */
import db from 'api/utils/testing_db';

const templateId = db.id();
export default {
  entities: [
    {
      sharedId: 'entity1',
      title: 'test_doc1',
      template: templateId,
      metadata: {
        date: '123442',
        other_date: 322342,
        multi_date: ['12344', 34234, ''],
        date_range: { from: '234842', to: '3243423' },
        multi_date_range: [
          { from: '23442', to: '3243423' },
          { from: '23442', to: 3243423 },
        ],
        text: '23442',
        country: ['sdf3fsf4'],
      },
    },
    {
      sharedId: 'entity2',
      title: 'test_doc2',
      template: templateId,
      metadata: {
        date: '123442',
        other_date: null,
        multi_date: ['12344', 34234, ''],
        date_range: { from: '23442', to: null },
        multi_date_range: [
          { from: null, to: '3243423' },
          { from: '23442', to: 3243423 },
        ],
        text: '23442',
        country: ['sdf3fsf4'],
      },
    },
  ],
  templates: [
    {
      _id: templateId,
      title: 'document',
      default: true,
      properties: [
        { name: 'date', type: 'date' },
        { name: 'other_date', type: 'date' },
        { name: 'multi_date', type: 'multidate' },
        { name: 'date_range', type: 'daterange' },
        { name: 'multi_date_range', type: 'multidaterange' },
        { name: 'text', type: 'text' },
        { name: 'country', type: 'relationship' },
      ],
    },
  ],
};

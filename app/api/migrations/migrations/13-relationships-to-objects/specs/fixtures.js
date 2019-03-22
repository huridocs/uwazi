import db from 'api/utils/testing_db';

const template1 = db.id().toString();

export default {
  entities: [
    { title: 'migrated', sharedId: 'doc1', template: template1, metadata: { text: 'asd', pais: ['1', '2'] } },
    { sharedId: 'doc2', template: template1, metadata: { text: 'asd' } },
    { sharedId: 'doc2', metadata: { text: 'asd' } },
  ],
  templates: [
    {
      _id: template1,
      properties: [
        { name: 'text', type: 'text' },
        { name: 'pais', type: 'relationship' }
      ]
    }
  ]
};

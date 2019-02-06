import db from 'api/utils/testing_db';

const search1Id = db.id();
const doc1Id = 'doc1';
const docWithoutTextId = 'docWithoutText';

export default {
  semanticsearches: [
    {
      _id: search1Id,
      searchTerm: 'legal',
      status: 'in_progress',
      language: 'en',
      documents: [
        { sharedId: doc1Id, status: 'pending' },
        { sharedId: docWithoutTextId, status: 'pending' }
      ]
    }
  ],
  entities: [
    {
      _id: db.id(), sharedId: 'doc1', language: 'en',
      fullText: { 1: 'page 1', 2: 'page 2' }
    },
    {
      _id: db.id(), sharedId: 'docWithoutText', language: 'en'
    }
  ]
};

export {
  search1Id,
  doc1Id,
  docWithoutTextId
};

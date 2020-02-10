import db from 'api/utils/testing_db';

const firstTemplate = db.id();
const firstDoc = db.id();
const firstDocSharedId = 'doc1';
const firstSemanticSearch = db.id();
const nonExistentId = db.id();

export default {
  activitylogs: [
    {
      method: 'POST',
      url: '/api/entities',
      query: '{}',
      body: '{"_id":"123","title":"Hello"}',
      time: 1560770143000,
      username: 'admin',
    },
  ],

  templates: [{ _id: firstTemplate, name: 'Existing Template' }],

  entities: [
    {
      _id: firstDoc,
      title: 'My Doc',
      sharedId: firstDocSharedId,
      language: 'es',
      attachments: [{ _id: 'attach1' }],
    },
  ],

  semanticsearches: [{ _id: firstSemanticSearch, searchTerm: 'foo' }],
};

export { firstTemplate, firstDoc, firstDocSharedId, firstSemanticSearch, nonExistentId };

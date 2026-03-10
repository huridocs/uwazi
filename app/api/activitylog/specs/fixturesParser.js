import { testingDB } from 'api/utils/testing_db';

const firstTemplate = testingDB.id();
const firstDoc = testingDB.id();
const firstDocSharedId = 'doc1';
const firstSemanticSearch = testingDB.id();
const nonExistentId = testingDB.id();
const fileId = testingDB.id();
const userId = testingDB.id();
const groupId = testingDB.id();
const suggestionId = testingDB.id();
const extractorId = testingDB.id();

const fixtures = {
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

  files: [
    {
      _id: fileId,
      originalname: 'My File',
      entity: firstDocSharedId,
    },
  ],

  semanticsearches: [{ _id: firstSemanticSearch, searchTerm: 'foo' }],

  users: [
    {
      _id: userId,
      username: 'User 1',
    },
  ],
  usergroups: [
    {
      _id: groupId,
      name: 'Group 1',
      members: [{ refId: userId }],
    },
  ],
  ixsuggestions: [
    {
      _id: suggestionId,
      entityId: firstDocSharedId,
      propertyName: 'title',
      suggestedValue: 'Red Robin',
      segment: 'Red Robin.',
      language: 'en',
      date: 5,
      page: 2,
      extractorId,
    },
  ],
  ixextractors: [
    {
      _id: extractorId,
      name: 'extractor_name',
      property: 'title',
      templates: [],
    },
  ],
};

export {
  fixtures,
  firstTemplate,
  firstDoc,
  firstDocSharedId,
  firstSemanticSearch,
  nonExistentId,
  fileId,
  userId,
  groupId,
  suggestionId,
  extractorId,
};

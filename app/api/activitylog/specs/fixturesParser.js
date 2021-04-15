import db from 'api/utils/testing_db';

const firstTemplate = db.id();
const firstDoc = db.id();
const firstDocSharedId = 'doc1';
const firstSemanticSearch = db.id();
const nonExistentId = db.id();
const fileId = db.id();
const userId = db.id();
const groupId = db.id();

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
};

export {
  firstTemplate,
  firstDoc,
  firstDocSharedId,
  firstSemanticSearch,
  nonExistentId,
  fileId,
  userId,
  groupId,
};

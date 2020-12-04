import db from 'api/utils/testing_db';

const entity1Id = db.id();
const entity2Id = db.id();
const entity3Id = db.id();

export default {
  entities: [
    {
      _id: entity1Id,
      sharedId: 'shared1',
      type: 'entity',
      language: 'en',
      title: 'Entity 1',
      published: true,
      permissions: [
        {
          _id: 'userA',
          type: 'user',
          permission: 'read',
        },
        {
          _id: 'userA',
          type: 'user',
          permission: 'write',
        },
        {
          _id: 'groupA',
          type: 'group',
          permission: 'write',
        },
      ],
    },
    {
      _id: entity2Id,
      sharedId: 'shared2',
      type: 'entity',
      language: 'en',
      title: 'Entity 2',
      creationDate: 1,
      published: true,
      permissions: [{}],
    },
    {
      _id: entity3Id,
      sharedId: 'shared3',
      type: 'entity',
      language: 'en',
      title: 'Entity 3',
      creationDate: 1,
      published: true,
      isPublic: true,
    },
  ],
};

export { entity1Id, entity2Id, entity3Id };

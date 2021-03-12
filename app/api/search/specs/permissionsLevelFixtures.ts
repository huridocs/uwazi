import { testing_db, DBFixture } from 'api/utils/testing_db';

export const permissionsLevelFixtures: DBFixture = {
  entities: [
    {
      title: 'ent1',
      shareId: 'ent1',
      language: 'es',
      published: true,
      permissions: [{ level: 'read', _id: 'User1', type: 'user' }],
    },
    {
      title: 'ent2',
      shareId: 'ent2',
      language: 'es',
      published: true,
      permissions: [{ level: 'read', _id: 'User1', type: 'user' }],
    },
    {
      title: 'ent3',
      shareId: 'ent3',
      language: 'es',
      published: true,
      permissions: [
        { level: 'write', _id: 'User1', type: 'user' },
        { level: 'read', _id: 'User2', type: 'user' },
      ],
    },
  ],
};

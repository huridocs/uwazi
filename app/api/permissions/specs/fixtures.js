import db from 'api/utils/testing_db';

const idUserA = db.id();
const idUserB = db.id();
const idGroupA = db.id();
const idGroupB = db.id();

const userA = {
  _id: idUserA,
  username: 'UserA',
  role: 'admin',
  email: 'usera@domain.org',
};

const userB = {
  _id: idUserB,
  username: 'UserB',
  role: 'editor',
  email: 'userb@domain.org',
};

const groupA = {
  _id: idGroupA,
  name: 'Users GroupA',
  members: [{ _id: idUserA }],
};

const groupB = {
  _id: idGroupB,
  name: 'User1 GroupB',
  members: [{ _id: idUserB }],
};

const entity1 = {
  sharedId: 'shared1',
  type: 'entity',
  language: 'en',
  title: 'Entity 1',
  published: true,
  permissions: [
    {
      _id: idUserA,
      type: 'user',
      level: 'read',
    },
    {
      _id: idUserB,
      type: 'user',
      level: 'write',
    },
    {
      _id: idGroupA,
      type: 'group',
      level: 'write',
    },
  ],
};
const entity2 = {
  sharedId: 'shared2',
  type: 'entity',
  language: 'en',
  title: 'Entity 2',
  creationDate: 1,
  published: true,
  permissions: [{}],
};
const entity3 = {
  sharedId: 'shared3',
  type: 'entity',
  language: 'en',
  title: 'Entity 3',
  creationDate: 1,
  published: true,
  isPublic: true,
};

export default {
  entities: [
    {
      ...entity1,
      _id: db.id(),
      language: 'en',
    },
    {
      ...entity1,
      _id: db.id(),
      language: 'es',
    },
    {
      ...entity2,
      _id: db.id(),
      language: 'es',
    },
    {
      ...entity2,
      _id: db.id(),
      language: 'pr',
    },
    {
      ...entity3,
      _id: db.id(),
      language: 'en',
    },
    {
      ...entity3,
      _id: db.id(),
      language: 'pr',
    },
  ],
  users: [{ ...userA }, { ...userB }],
  usergroups: [{ ...groupA }, { ...groupB }],
};

export { userA, userB, groupA, groupB };

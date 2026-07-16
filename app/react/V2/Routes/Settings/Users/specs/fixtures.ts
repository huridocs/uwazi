import type { User, UserGroup } from '#shared/contracts/Users.js';

const users: User[] = [
  {
    _id: 'user1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    groups: [{ _id: 'group1', name: 'Editors' }],
  },
  {
    _id: 'user2',
    username: 'editor',
    email: 'editor@example.com',
    role: 'editor',
    groups: [],
  },
];

const groups: UserGroup[] = [
  {
    _id: 'group1',
    name: 'Editors',
    members: [{ refId: 'user1', username: 'admin' }],
  },
  {
    _id: 'group2',
    name: 'Reviewers',
    members: [],
  },
];

export { users, groups };

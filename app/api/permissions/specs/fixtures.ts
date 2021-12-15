import db, { DBFixture } from 'api/utils/testing_db';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserRole } from 'shared/types/userSchema';

const idUserA = db.id();
const idUserB = db.id();
const idGroupA = db.id();
const idGroupB = db.id();
const nonExistingGroup = db.id();

const userA = {
  _id: idUserA,
  username: 'UserA',
  role: UserRole.ADMIN,
  email: 'usera@domain.org',
};

const userB = {
  _id: idUserB,
  username: 'UserB',
  role: UserRole.EDITOR,
  email: 'userb@domain.org',
};

const groupA = {
  _id: idGroupA,
  name: 'Users GroupA',
  members: [{ refId: idUserA }],
};

const groupB = {
  _id: idGroupB,
  name: 'User1 GroupB',
  members: [{ refId: idUserB }],
};

const entity1 = {
  sharedId: 'shared1',
  type: 'entity',
  language: 'en',
  title: 'Entity 1',
  published: true,
  permissions: [
    {
      refId: idUserB,
      type: PermissionType.USER,
      level: AccessLevels.WRITE,
    },
    {
      refId: idUserA,
      type: PermissionType.USER,
      level: AccessLevels.READ,
    },
    {
      refId: idGroupA,
      type: PermissionType.GROUP,
      level: AccessLevels.WRITE,
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
  permissions: [
    {
      refId: idUserA,
      type: PermissionType.USER,
      level: AccessLevels.READ,
    },
    {
      refId: idGroupA,
      type: PermissionType.GROUP,
      level: AccessLevels.READ,
    },
    {
      refId: nonExistingGroup,
      type: PermissionType.GROUP,
      level: AccessLevels.READ,
    },
  ],
};

const entity3 = {
  sharedId: 'shared3',
  type: 'entity',
  language: 'en',
  title: 'Entity 3',
  creationDate: 1,
  published: true,
};

const entity4 = {
  sharedId: 'shared4',
  type: 'entity',
  language: 'en',
  title: 'Entity 4',
  creationDate: 1,
  published: false,
};

const fixtures: DBFixture = {
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
    {
      ...entity4,
      _id: db.id(),
      language: 'en',
    },
  ],
  users: [{ ...userA }, { ...userB }],
  usergroups: [{ ...groupA }, { ...groupB }],
};

export { fixtures, userA, userB, groupA, groupB };

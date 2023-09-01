import { User } from 'api/users.v2/model/User';
import { EntityPermissions, Entry } from '../EntityPermissions';

const collaborator = new User('collaborator', 'collaborator', ['group1']);

const editor = new User('editor', 'editor', []);

const admin = new User('admin', 'admin', []);

describe('EntityPermissions', () => {
  it.each([
    {
      case: 'collaborator should not be able to read unpublished entities without permission',
      permissionEntries: [],
      published: false,
      user: collaborator,
      level: 'read',
      expected: false,
    },
    {
      case: 'collaborator should be able to read unpublished entities with read permission',
      permissionEntries: [{ refId: 'collaborator', type: 'user', level: 'read' }],
      published: false,
      user: collaborator,
      level: 'read',
      expected: true,
    },
    {
      case: 'collaborator should be able to read unpublished entities with write permission',
      permissionEntries: [{ refId: 'collaborator', type: 'user', level: 'write' }],
      published: false,
      user: collaborator,
      level: 'read',
      expected: true,
    },
    {
      case: 'collaborator should be able to read published entities without permission',
      permissionEntries: [],
      published: true,
      user: collaborator,
      level: 'read',
      expected: true,
    },
    {
      case: 'collaborator should not be able to write without permission',
      permissionEntries: [],
      published: true,
      user: collaborator,
      level: 'write',
      expected: false,
    },
    {
      case: 'collaborator should not be able to write with only read permission',
      permissionEntries: [{ refId: 'collaborator', type: 'user', level: 'read' }],
      published: false,
      user: collaborator,
      level: 'write',
      expected: false,
    },
    {
      case: 'collaborator should be able to write with write permission',
      permissionEntries: [{ refId: 'collaborator', type: 'user', level: 'write' }],
      published: false,
      user: collaborator,
      level: 'write',
      expected: true,
    },
    {
      case: 'collaborator should receive read permission from group',
      permissionEntries: [{ refId: 'group1', type: 'group', level: 'read' }],
      published: false,
      user: collaborator,
      level: 'read',
      expected: true,
    },
    {
      case: 'collaborator should receive write permission from group',
      permissionEntries: [{ refId: 'group1', type: 'group', level: 'write' }],
      published: false,
      user: collaborator,
      level: 'write',
      expected: true,
    },
    {
      case: 'editor should be able to read without permission',
      permissionEntries: [],
      published: false,
      user: editor,
      level: 'read',
      expected: true,
    },
    {
      case: 'editor should be able to write without permission',
      permissionEntries: [],
      published: false,
      user: editor,
      level: 'write',
      expected: true,
    },
    {
      case: 'admin should be able to read without permission',
      permissionEntries: [],
      published: false,
      user: admin,
      level: 'read',
      expected: true,
    },
    {
      case: 'admin should be able to write without permission',
      permissionEntries: [],
      published: false,
      user: admin,
      level: 'write',
      expected: true,
    },
  ] as {
    case: string;
    permissionEntries: Entry[];
    published: boolean;
    user: User;
    level: 'read' | 'write';
    expected: boolean;
  }[])('$case', ({ permissionEntries, published, user, level, expected }) => {
    const permissions = new EntityPermissions('entity', permissionEntries, published);
    expect(permissions.allowsUserTo(user, level)).toBe(expected);
  });
});

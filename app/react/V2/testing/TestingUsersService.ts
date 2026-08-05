import type { User, UserGroup } from '#shared/contracts/Users.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from '#V2/services/contracts/ServiceRequestOptions.js';
import type {
  UserGroupsService,
  UserGroupInput,
} from '#V2/services/contracts/UserGroupsService.js';
import type { UsersService, UserInput } from '#V2/services/contracts/UsersService.js';

type TestingUsersServiceOptions = {
  initialUsers?: User[];
  initialGroups?: UserGroup[];
};

type TestingUsersService = UsersService & {
  seedUsers(users: User[]): void;
  snapshotUsers(): User[];
};

type TestingUserGroupsService = UserGroupsService & {
  seedGroups(groups: UserGroup[]): void;
  snapshotGroups(): UserGroup[];
};

const cloneUsers = (items: User[]): User[] =>
  items.map(user => ({
    ...user,
    groups: user.groups?.map(group => ({ ...group })),
  }));

const cloneGroups = (items: UserGroup[]): UserGroup[] =>
  items.map(group => ({
    ...group,
    members: group.members.map(member => ({ ...member })),
  }));

const createTestingUsersService = ({
  initialUsers = [],
}: Pick<TestingUsersServiceOptions, 'initialUsers'> = {}): TestingUsersService => {
  let users = cloneUsers(initialUsers);
  let nextId = 1;

  const service: TestingUsersService = {
    getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<User[]>> => [
      cloneUsers(users),
    ],

    getCurrent: async () => [users[0], undefined],

    upsert: async (
      user: UserInput,
      _currentPassword: string,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<unknown>> => {
      nextId += 1;
      const id = user._id ?? `testing-user-${nextId}`;
      const saved: User = { ...user, _id: id };
      const index = users.findIndex(existing => existing._id === id);

      if (index >= 0) {
        users[index] = saved;
      } else {
        users.push(saved);
      }

      return [{ user: saved }];
    },

    delete: async (
      toDelete: User[],
      _currentPassword: string,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<unknown>> => {
      const ids = toDelete.map(user => user._id).filter((id): id is string => Boolean(id));
      users = users.filter(user => !ids.includes(user._id!));
      return [{ acknowledged: true, deletedCount: ids.length }];
    },

    unlockAccount: async () => [undefined, undefined],

    requestPasswordReset: async () => [undefined, undefined],

    reset2FA: async () => [undefined, undefined],

    get2FASecret: async () => [
      { otpauth: 'otpauth://totp/testing', secret: 'TESTING-SECRET' },
      undefined,
    ],

    enable2FA: async () => [undefined, undefined],

    seedUsers: (next: User[]) => {
      users = cloneUsers(next);
    },

    snapshotUsers: () => cloneUsers(users),
  };

  return service;
};

const createTestingUserGroupsService = ({
  initialGroups = [],
}: Pick<TestingUsersServiceOptions, 'initialGroups'> = {}): TestingUserGroupsService => {
  let groups = cloneGroups(initialGroups);
  let nextId = 1;

  const service: TestingUserGroupsService = {
    getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<UserGroup[]>> => [
      cloneGroups(groups),
    ],

    upsert: async (
      group: UserGroupInput,
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<unknown>> => {
      nextId += 1;
      const id = group._id ?? `testing-group-${nextId}`;
      const saved: UserGroup = {
        ...group,
        _id: id,
        members: group.members ?? [],
      };
      const index = groups.findIndex(existing => existing._id === id);

      if (index >= 0) {
        groups[index] = saved;
      } else {
        groups.push(saved);
      }

      return [saved];
    },

    delete: async (
      toDelete: UserGroup[],
      _options?: ServiceRequestOptions
    ): Promise<ApiResponse<unknown>> => {
      const ids = toDelete.map(group => group._id).filter((id): id is string => Boolean(id));
      groups = groups.filter(group => !ids.includes(group._id!));
      return [{ acknowledged: true, deletedCount: ids.length }];
    },

    seedGroups: (next: UserGroup[]) => {
      groups = cloneGroups(next);
    },

    snapshotGroups: () => cloneGroups(groups),
  };

  return service;
};

const createTestingUsersSettingsServices = (
  options: TestingUsersServiceOptions = {}
): {
  services: { users: TestingUsersService; userGroups: TestingUserGroupsService };
  users: TestingUsersService;
  userGroups: TestingUserGroupsService;
} => {
  const users = createTestingUsersService({ initialUsers: options.initialUsers });
  const userGroups = createTestingUserGroupsService({ initialGroups: options.initialGroups });

  return {
    services: { users, userGroups },
    users,
    userGroups,
  };
};

export {
  createTestingUsersService,
  createTestingUserGroupsService,
  createTestingUsersSettingsServices,
};
export type { TestingUsersService, TestingUserGroupsService, TestingUsersServiceOptions };

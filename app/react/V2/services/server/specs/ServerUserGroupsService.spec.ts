import { UserGroupsQueryServiceFactory } from '#api/core/infrastructure/factories/UserGroupsQueryServiceFactory.js';
import { createServerUserGroupsService } from '../ServerUserGroupsService.js';

const ctx = { headers: { cookie: 'session=1' } };
const service = createServerUserGroupsService(ctx);

const groups = [
  {
    _id: 'group-1',
    name: 'Group 1',
    members: [
      { refId: 'user-1', username: 'user1', role: 'admin', email: 'user1@test.com' },
      { refId: 'orphan' },
    ],
  },
];

describe('ServerUserGroupsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * The server-rendered first paint and a client-side revalidate feed the same screen from
   * different transports, so they have to resolve the same contract. This asserts the SSR path
   * goes through UserGroupsQueryService — before, it called the v1 getter, which always read
   * Mongo and returned raw documents.
   */
  it('getAll should return the query service rows unchanged', async () => {
    const listUserGroups = jest.fn().mockResolvedValue(groups);
    jest
      .spyOn(UserGroupsQueryServiceFactory, 'default')
      .mockReturnValue({ listUserGroups } as never);

    const [data, error] = await service.getAll();

    expect(error).toBeUndefined();
    expect(data).toEqual(groups);
    expect(listUserGroups).toHaveBeenCalledWith();
  });

  // `toApiError` converts recognized transport failures and rethrows anything else, so a
  // read that blows up reaches the SSR error boundary rather than being swallowed into an
  // empty group list. Unchanged by the move off the v1 getter — pinned because it is the
  // difference between a visible failure and a screen that silently renders no groups.
  it('getAll should let an unrecognized read failure propagate', async () => {
    jest.spyOn(UserGroupsQueryServiceFactory, 'default').mockReturnValue({
      listUserGroups: async () => {
        throw new Error('boom');
      },
    } as never);

    await expect(service.getAll()).rejects.toThrow('boom');
  });

  it('upsert returns not implemented', async () => {
    const [data, error] = await service.upsert({ name: 'Group 1', members: [] });

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });

  it('delete returns not implemented', async () => {
    const [data, error] = await service.delete([{ name: 'Group 1', members: [] }]);

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });
});

import { UserGroupsQueryServiceFactory } from '#api/core/infrastructure/factories/UserGroupsQueryServiceFactory.js';

/**
 * The group ids in a request that match no group. Users are saved without them, as the HTTP API
 * does; the CLI names them so the caller can tell. Must run inside the tenant.
 */
class IgnoredGroups {
  static async of(groupIds: string[] = []): Promise<string[]> {
    if (!groupIds.length) {
      return [];
    }

    const groups = await UserGroupsQueryServiceFactory.default().listUserGroups();
    const existing = new Set(groups.map(group => group._id));

    return groupIds.filter(id => !existing.has(id));
  }
}

export { IgnoredGroups };

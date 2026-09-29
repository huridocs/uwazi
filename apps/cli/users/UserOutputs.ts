import type {
  RoleCounts,
  UserProfile,
  UserView,
} from '#api/core/application/contracts/UserReadModels.js';
import type { RoleCountsOutput, UserListItem, UserOutput } from './contracts.js';

/** Maps domain objects and read models onto the CLI output contract, field by field. */
class UserOutputs {
  static user({ _id, username, email, role }: UserView): UserOutput {
    return { id: _id, username, email, role };
  }

  static listItem(profile: UserProfile): UserListItem {
    return {
      ...UserOutputs.user(profile),
      groups: profile.groups.map(group => ({ id: group._id, name: group.name })),
      using2fa: profile.using2fa,
      accountLocked: profile.accountLocked,
    };
  }

  static roleCounts(counts: RoleCounts): RoleCountsOutput {
    return {
      ...counts,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    };
  }
}

export { UserOutputs };

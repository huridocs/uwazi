import { UserRole } from '#api/core/domain/user/User.js';
import type { UserGroupView } from './UserGroupReadModels.js';

type UserView = {
  _id: string;
  username: string;
  role: UserRole;
  email: string;
};

type UserProfile = UserView & {
  groups: UserGroupView[];
  using2fa: boolean;
  accountLocked: boolean;
};

type RoleCounts = Record<UserRole, number>;

const zeroFilledByRole = (counts: Record<string, number>): RoleCounts =>
  Object.values(UserRole).reduce(
    (acc, role) => ({ ...acc, [role]: counts[role] ?? 0 }),
    {} as RoleCounts
  );

export type { UserView, UserProfile, RoleCounts };
export { zeroFilledByRole };

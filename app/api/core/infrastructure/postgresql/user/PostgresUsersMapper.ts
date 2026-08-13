import { User, UserRole } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { Credentials } from '#api/core/domain/user/Credentials.js';
import type { UserProfile, UserView } from '#api/core/application/contracts/UserReadModels.js';
import type { UserRow } from './PostgresUserRow.js';
import type { UserWithGroupsRow } from './PostgresUsersDAO.js';

export class PostgresUsersMapper {
  static toRow(user: User): UserRow {
    const row: UserRow = {
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
    };

    if (!(user instanceof UserAccount)) {
      return row;
    }

    row.password = user.credentials.password.getValue();
    row.failedLogins = user.credentials.failedLogins;
    row.accountLocked = user.credentials.accountLocked;
    row.accountUnlockCode = user.credentials.accountUnlockCode ?? null;
    row.using2fa = user.credentials.using2fa;
    row.secret = user.credentials.secret ?? null;

    return row;
  }

  static toDomain(row: UserRow): User {
    return new User({
      _id: row._id,
      username: row.username,
      role: row.role as UserRole,
      email: row.email,
    });
  }

  /**
   * The read side (D1/D2). Field-by-field on purpose: this constructor and `toProfile` are
   * the *only* way a read model comes into existence, so a spread of the row here would put
   * `password` / `secret` / `deletedAt` back on the wire the instant one is selected in.
   *
   * `_id` is already a string on this backend — no conversion, unlike Mongo's ObjectId.
   */
  static toView(row: UserRow): UserView {
    return {
      _id: row._id,
      username: row.username,
      role: row.role as UserRole,
      email: row.email,
    };
  }

  static toProfile(row: UserWithGroupsRow): UserProfile {
    return {
      ...PostgresUsersMapper.toView(row),
      // Rebuilt rather than passed through, so the read model carries exactly {_id, name}
      // whatever `jsonb_build_object` happens to emit.
      groups: row.groups.map(group => ({ _id: group._id, name: group.name })),
      // Optional in the row, required in UserProfile (D2).
      using2fa: Boolean(row.using2fa),
      accountLocked: Boolean(row.accountLocked),
    };
  }

  static toAccountDomain(row: UserRow): UserAccount {
    return new UserAccount({
      _id: row._id,
      username: row.username,
      role: row.role as UserRole,
      email: row.email,
      credentials: new Credentials({
        password: EncryptedPassword.fromHash(row.password!),
        failedLogins: row.failedLogins,
        accountLocked: row.accountLocked,
        accountUnlockCode: row.accountUnlockCode ?? undefined,
        using2fa: row.using2fa,
        secret: row.secret,
      }),
    });
  }
}

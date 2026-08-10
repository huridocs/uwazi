import { User, UserRole } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { Credentials } from '#api/core/domain/user/Credentials.js';
import type { UserRow } from './PostgresUserRow.js';

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

import { ObjectId } from 'mongodb';
import { User } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { Credentials } from '#api/core/domain/user/Credentials.js';
import { UserDBO } from './UserDBO.js';

export class MongoUsersMapper {
  static toDBO(user: User): UserDBO {
    const dbo: UserDBO = {
      _id: ObjectId.createFromHexString(user._id),
      username: user.username,
      role: user.role,
      email: user.email,
    };

    if (!(user instanceof UserAccount)) {
      return dbo;
    }

    dbo.password = user.credentials.password.getValue();
    dbo.failedLogins = user.credentials.failedLogins;
    dbo.accountLocked = user.credentials.accountLocked;
    dbo.accountUnlockCode = user.credentials.accountUnlockCode;
    dbo.using2fa = user.credentials.using2fa;
    dbo.secret = user.credentials.secret ?? null;

    return dbo;
  }

  static toDomain(dbo: UserDBO): User {
    return new User({
      _id: dbo._id.toHexString(),
      username: dbo.username,
      role: dbo.role,
      email: dbo.email,
    });
  }

  static toAccountDomain(dbo: UserDBO): UserAccount {
    return new UserAccount({
      _id: dbo._id.toHexString(),
      username: dbo.username,
      role: dbo.role,
      email: dbo.email,
      credentials: new Credentials({
        password: EncryptedPassword.fromHash(dbo.password!),
        failedLogins: dbo.failedLogins,
        accountLocked: dbo.accountLocked,
        accountUnlockCode: dbo.accountUnlockCode,
        using2fa: dbo.using2fa,
        secret: dbo.secret,
      }),
    });
  }
}

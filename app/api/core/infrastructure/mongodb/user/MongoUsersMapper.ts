import { ObjectId } from 'mongodb';
import { User } from '#api/core/domain/user/User.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { UserDBO } from './UserDBO.js';

export class MongoUsersMapper {
  static toDBO(user: User): UserDBO {
    const dbo: UserDBO = {
      _id: ObjectId.createFromHexString(user._id),
      username: user.username,
      role: user.role,
      email: user.email,
    };

    if (user.password === undefined) {
      return dbo;
    }

    dbo.password = user.password?.getValue() ?? null;

    return dbo;
  }

  static toDomain(dbo: UserDBO): User {
    const user = new User({
      _id: dbo._id.toHexString(),
      username: dbo.username,
      role: dbo.role as 'admin' | 'editor' | 'collaborator',
      email: dbo.email,
    });

    if (dbo.password) {
      user.setPassword(EncryptedPassword.fromHash(dbo.password));
    }

    return user;
  }
}

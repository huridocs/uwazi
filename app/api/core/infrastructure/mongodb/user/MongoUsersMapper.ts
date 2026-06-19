import { ObjectId } from 'mongodb';
import { User } from '#api/core/domain/user/User.js';
import { UserDBO } from './UserDBO.js';

export class MongoUsersMapper {
  static toDBO(user: User): UserDBO {
    return {
      _id: ObjectId.createFromHexString(user._id),
      username: user.username,
      role: user.role,
      email: user.email,
      using2fa: user.using2fa,
      secret: user.secret,
      password: user.password,
    };
  }

  static toDomain(dbo: UserDBO): User {
    const user = new User({
      _id: dbo._id.toHexString(),
      username: dbo.username,
      role: dbo.role as 'admin' | 'editor' | 'collaborator',
      email: dbo.email,
      using2fa: dbo.using2fa,
      secret: dbo.secret,
    });

    user.password = dbo.password ?? null;

    return user;
  }
}

import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { User } from '../model/User';
import { UserDBOType } from './schemas/userTypes';

export const UserMappers = {
  toModel(user: UserDBOType) {
    return new User(
      user._id?.toHexString() || MongoIdGenerator.generate(),
      user.role,
      user.groups?.map(g => g.name) || []
    );
  },
};

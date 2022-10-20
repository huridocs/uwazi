import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { UserDataSource } from '../contracts/UserDataSource';
import { UserMappers } from './UserMappers';
import { UserDBOType } from './schemas/userTypes';
import { User } from '../model/User';

export class MongoUserDataSource extends MongoDataSource implements UserDataSource {
  protected collectionName = 'users';

  get(_id: string) {
    const id = MongoIdGenerator.mapToDb(_id);
    const cursor = this.getCollection().find({ _id: { $in: id } });
    return new MongoResultSet<UserDBOType, User>(cursor, UserMappers.toModel);
  }
}

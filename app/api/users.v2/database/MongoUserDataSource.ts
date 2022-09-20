import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdGenerator } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { UserDataSource } from '../contracts/UserDataSource';
import { validateUserDBO } from './schemas/userSchemas';
import { UserDBOType } from './schemas/userTypes';
import { User } from '../model/User';

export class MongoRelationshipsDataSource extends MongoDataSource implements UserDataSource {
  private getCollection() {
    return this.db.collection('users');
  }

  get(_id: string) {
    const id = MongoIdGenerator.mapToDb(_id);
    const cursor = this.getCollection().find({ _id: { $in: id } });
    return new MongoResultSet<UserDBOType, User>(cursor, validateUserDBO, UserMappers.toModel);
  }
}

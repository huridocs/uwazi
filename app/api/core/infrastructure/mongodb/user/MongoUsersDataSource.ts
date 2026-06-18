import { ObjectId, Db } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { User } from '#api/core/domain/user/User.js';

type UserDBO = {
  // _id: ObjectId;
  // username: string;
  // email: string;
  // role: 'admin' | 'editor' | 'collaborator';
  // password: string;
  // using2fa?: boolean;
  // secret?: string | null;
  // failedLogins?: number;
  // accountLocked?: boolean;
  // accountUnlockCode?: string | null;
  // groups?: { _id: ObjectId; name: string }[];
};

class MongoUsersDataSource extends MongoDataSource implements UsersDataSource {
  protected collectionName = 'users';

  // constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
  //   super(db, transactionManager, options);
  // }

  // async getById(id: string): Promise<User | undefined> {
  //   const doc = await this.getCollection<UserDBO>().findOne({
  //     _id: ObjectId.createFromHexString(id),
  //   });

  //   if (!doc) {
  //     return undefined;
  //   }

  //   const groups = doc.groups?.map(g => ({
  //     _id: g._id.toHexString(),
  //     name: g.name,
  //   }));

  //   return new User({
  //     _id: doc._id.toHexString(),
  //     username: doc.username,
  //     role: doc.role,
  //     email: doc.email,
  //     password: doc.password,
  //     using2fa: doc.using2fa,
  //     secret: doc.secret,
  //     failedLogins: doc.failedLogins,
  //     accountLocked: doc.accountLocked,
  //     accountUnlockCode: doc.accountUnlockCode,
  //     groups,
  //   });
  // }
}

export { MongoUsersDataSource, UserDBO };

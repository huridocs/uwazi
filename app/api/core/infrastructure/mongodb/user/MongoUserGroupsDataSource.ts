import { Db, ObjectId } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { User } from '#api/core/domain/user/User.js';
import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import { UserGroupNameExists } from '#api/core/domain/userGroup/errors.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import {
  UserGroupsDataSource,
  CreateUserGroupParams,
  UpdateUserGroupParams,
} from '#api/core/application/contracts/UserGroupsDataSource.js';
import { UserGroupDBO } from './UserGroupDBO.js';

class MongoUserGroupsDataSource
  extends MongoDataSource<UserGroupDBO>
  implements UserGroupsDataSource
{
  protected collectionName = 'usergroups';

  private idGenerator: IdGenerator;

  constructor(
    db: Db,
    transactionManager: TransactionManager,
    idGenerator: IdGenerator,
    options?: MongoDSOptions
  ) {
    super(db, transactionManager, options);
    this.idGenerator = idGenerator;
  }

  async getUserGroups(user: User): Promise<User['groups']> {
    const collection = this.getCollection();
    const groupDocuments = await collection.find({ 'members.refId': user._id }).toArray();
    return groupDocuments.map(group => ({
      _id: group._id.toString(),
      name: group.name,
    }));
  }

  async updateUserGroups(user: User): Promise<void> {
    const targetGroupIds = user.groups.map(group => ObjectId.createFromHexString(group._id));

    const collection = this.getCollection();

    if (targetGroupIds.length > 0) {
      await collection.updateMany(
        { _id: { $in: targetGroupIds } },
        { $addToSet: { members: { refId: user._id } } }
      );
    }

    await collection.updateMany(
      { _id: { $nin: targetGroupIds }, 'members.refId': user._id },
      { $pull: { members: { refId: user._id } } }
    );
  }

  async removeUsersFromGroups(userIds: string[]): Promise<void> {
    const collection = this.getCollection();
    await collection.updateMany({}, { $pull: { members: { refId: { $in: userIds } } } });
  }

  async create({ name, memberIds }: CreateUserGroupParams): Promise<UserGroup> {
    const id = this.idGenerator.generate();
    const collection = this.getCollection();

    await collection.insertOne({
      _id: ObjectId.createFromHexString(id),
      name,
      members: memberIds.map(refId => ({ refId })),
    });

    return new UserGroup(id, name, memberIds);
  }

  async update({ id, name, memberIds }: UpdateUserGroupParams): Promise<UserGroup> {
    const collection = this.getCollection();

    await collection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { name, members: memberIds.map(refId => ({ refId })) } }
    );

    return new UserGroup(id, name, memberIds);
  }

  async delete(ids: string[]): Promise<void> {
    const collection = this.getCollection();
    await collection.deleteMany({ _id: { $in: ids.map(ObjectId.createFromHexString) } });
  }

  async checkUniqueName(
    name: string,
    excludeId?: string
  ): Promise<ResultType<true, UserGroupNameExists>> {
    const collection = this.getCollection();
    const count = await collection.countDocuments({
      name: new RegExp(`^${name}$`, 'i'),
      ...(excludeId ? { _id: { $ne: ObjectId.createFromHexString(excludeId) } } : {}),
    });

    if (count > 0) {
      return Result.fail(new UserGroupNameExists(name));
    }

    return Result.ok(true);
  }
}

export { MongoUserGroupsDataSource };

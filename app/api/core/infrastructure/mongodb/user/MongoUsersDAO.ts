import { MongoDataSource } from '../common/MongoDataSource.js';

import { UserDBO } from './UserDBO.js';

class MongoUsersDAO extends MongoDataSource<UserDBO> {
  protected collectionName: string = 'users';

  //   private cleanUsers(users):users {
  //   username: { type: String, unique: true, required: true },
  //   password: { type: String, select: false, required: true },
  //   email: { type: String, unique: true, required: true },
  //   role: { type: String, unique: false, required: true },
  //   failedLogins: { type: Number, required: false, select: false },
  //   accountLocked: { type: Boolean, select: false },
  //   accountUnlockCode: { type: String, select: false },
  //   using2fa: { type: Boolean, default: false },
  //   secret: { type: String, select: false },
  // }

  //this would be use by a controller that get's the users
  //for queries we don't use usecases?
  async getUsersWithGroups() {
    //cleanup of password and other private fields goes here
    // aggregate users and usergroups
    //   const aggregation = [
    //   { $match: query },
    //   {
    //     $group: {
    //       _id: '$sharedId',
    //       template: { $first: '$template' },
    //       entities: { $push: '$$ROOT' },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'templates',
    //       localField: 'template',
    //       foreignField: '_id',
    //       as: 'templateData',
    //     },
    //   },
    //   { $unwind: '$templateData' },
    //   {
    //     $project: {
    //       _id: 0,
    //       template: '$templateData',
    //       entities: 1,
    //     },
    //   },
    // ];
    // this.getCollection().find();
  }
}

export { MongoUsersDAO };

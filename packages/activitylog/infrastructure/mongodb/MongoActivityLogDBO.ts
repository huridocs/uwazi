import { ObjectId } from 'mongodb';

/**
 * An `activitylogs` document. `user` and `username` are absent on a request made without a user,
 * and `expireAt` is what the collection's TTL index deletes entries by.
 */
type MongoActivityLogDBO = {
  _id: ObjectId;
  method: string;
  url: string;
  params: string;
  query: string;
  body: string;
  user?: ObjectId;
  username?: string;
  time: number;
  expireAt?: Date;
};

export type { MongoActivityLogDBO };

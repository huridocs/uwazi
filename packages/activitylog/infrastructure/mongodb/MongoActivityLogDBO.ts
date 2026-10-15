import { ObjectId } from 'mongodb';

/**
 * An `activitylogs` document. Every entry written today carries all the request details; older
 * ones, and those migrations write, may lack some. `user` and `username` are absent or null on a
 * request made without a user, and `expireAt` is what the collection's TTL index deletes entries
 * by.
 */
type MongoActivityLogDBO = {
  _id: ObjectId;
  method: string;
  url: string;
  params?: string;
  query?: string;
  body?: string;
  user?: ObjectId | null;
  username?: string | null;
  time: number;
  expireAt?: Date;
};

export type { MongoActivityLogDBO };

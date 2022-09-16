import { ObjectId } from 'mongodb';

import { IdGenerator } from '../contracts/IdGenerator';

export const MongoIdGenerator: IdGenerator<string, ObjectId> = {
  generate: () => new ObjectId().toHexString(),
  mapToDb: (id: string) => new ObjectId(id),
  mapToApp: (id: ObjectId) => id.toHexString(),
};

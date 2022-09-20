import { ObjectId } from 'mongodb';

export const MongoIdGenerator = {
  generate: () => new ObjectId().toHexString(),
  mapToDb: (id: string) => new ObjectId(id),
  mapToApp: (id: ObjectId) => id.toHexString(),
};

import { ObjectId } from 'mongodb';

import { IdHandler } from 'api/common.v2/contracts/IdHandler';

export const MongoIdGenerator: IdHandler<ObjectId> = {
  generate: () => new ObjectId().toHexString(),
  mapToDb: (id: string) => new ObjectId(id),
  mapToApp: (id: ObjectId) => id.toHexString(),
};

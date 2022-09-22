import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { ObjectId } from 'mongodb';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';

export class MongoEntitiesDataSource extends MongoDataSource implements EntitiesDataSource {
  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .countDocuments({ sharedId: { $in: sharedIds } }, { session: this.session });
    return countInExistence === sharedIds.length;
  }

  getByIds(sharedIds: string[]) {
    const cursor = this.db
      .collection<{ sharedId: string; template: ObjectId }>('entities')
      .find({ sharedId: { $in: sharedIds } }, { projection: { sharedId: 1, template: 1 } });

    return new MongoResultSet(cursor, ({ sharedId, template }) => ({
      sharedId,
      template: template.toHexString(),
    }));
  }
}

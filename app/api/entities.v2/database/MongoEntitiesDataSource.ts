import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';

export class MongoEntitiesDataSource extends MongoDataSource implements EntitiesDataSource {
  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .countDocuments({ sharedId: { $in: sharedIds } }, { session: this.session });
    return countInExistence === sharedIds.length;
  }
}

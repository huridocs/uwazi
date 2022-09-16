import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';

export class EntitiesDataSource extends MongoDataSource {
  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .countDocuments({ sharedId: { $in: sharedIds } }, { session: this.session });
    return countInExistence === sharedIds.length;
  }
}

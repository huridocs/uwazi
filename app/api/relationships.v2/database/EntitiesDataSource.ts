import { MongoDataSource } from './MongoDataSource';
import { MongoResultSet } from './MongoResultSet';

export class EntitiesDataSource extends MongoDataSource {
  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .countDocuments({ sharedId: { $in: sharedIds } }, { session: this.session });
    return countInExistence === sharedIds.length;
  }

  getByIds(sharedIds: string[]) {
    const cursor = this.db.collection('entities').find({ sharedId: { $in: sharedIds } });
    return new MongoResultSet(cursor, MongoResultSet.NoOpMapper);
  }
}

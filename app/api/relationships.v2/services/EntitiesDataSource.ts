import { Db } from 'mongodb';

export class EntitiesDataSource {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .find({ sharedId: { $in: sharedIds } }, { projection: { sharedId: 1 } })
      .count();
    return countInExistence === sharedIds.length;
  }
}

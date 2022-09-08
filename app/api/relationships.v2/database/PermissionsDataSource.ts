import { Db } from 'mongodb';
import { EntitySchema } from 'shared/types/entityType';

export class PermissionsDataSource {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async getByEntity(sharedId: string) {
    const entity = await this.db
      .collection<EntitySchema>('entities')
      .findOne({ sharedId }, { projection: { sharedId: 1, permissions: 1 } });
    return entity?.permissions;
  }
}

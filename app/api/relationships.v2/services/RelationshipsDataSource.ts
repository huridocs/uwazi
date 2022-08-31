import { Db } from 'mongodb';

export class RelationshipsDataSource {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async insert(relationship: any) {
    const {
      ops: [created],
    } = await this.db.collection('relationships').insertOne(relationship);

    return created;
  }
}

import { Db, MongoClient } from 'mongodb';

export class CreateRelationshipService {
  private db: Db;

  private client: MongoClient;

  constructor(db: Db, client: MongoClient) {
    this.db = db;
    this.client = client;
  }

  private async entitiesExist(sharedIds: string[]) {
    const countInExistence = await this.db
      .collection('entities')
      .find({ sharedId: { $in: sharedIds } }, { projection: { sharedId: 1 } })
      .count();
    return countInExistence === sharedIds.length;
  }

  async create(from: string, to: string) {
    let _created;
    const session = this.client.startSession();
    await session.withTransaction(
      async () => {
        if (!(await this.entitiesExist([from, to]))) {
          throw new Error('Must provide sharedIds from existing entities');
        }

        const {
          ops: [created],
        } = await this.db.collection('relationships').insertOne({
          from,
          to,
        });

        _created = created;
      },
      {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      }
    );

    return _created;
  }
}

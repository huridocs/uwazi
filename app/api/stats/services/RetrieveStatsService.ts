import { Db } from 'mongodb';
import { elastic } from 'api/search';

export class RetrieveStatsService {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async execute() {
    return {
      users: await this.calculateUserStats(),
      files: await this.calculateFileStats(),
      entities: await this.calculateEntityStats(),
      storage: await this.calculateStorageStats(),
    };
  }

  private async calculateStorageStats() {
    const [filesSize] = await this.db
      .collection('files')
      .aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' },
          },
        },
      ])
      .toArray();

    const dbStats = await this.db.stats();
    const elasticIndex = await elastic.cat.indices({
      pretty: true,
      format: 'application/json',
      bytes: 'b',
      h: 'store.size',
    });

    const elasticSize = elasticIndex.body[0]['store.size'];

    return {
      total:
        parseInt(filesSize?.totalSize || 0, 10) +
        parseInt(elasticSize, 10) +
        parseInt(dbStats.storageSize, 10),
    };
  }

  private async calculateEntityStats() {
    const entitiesCount = await this.db.collection('entities').countDocuments();
    return { total: entitiesCount };
  }

  private async calculateFileStats() {
    const filesCount = await this.db.collection('files').countDocuments();
    return { total: filesCount };
  }

  private async calculateUserStats() {
    const users = await this.db
      .collection('users')
      .aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
      .toArray();

    return users.reduce(
      (previousValue, currentValue) => {
        previousValue[currentValue._id] = currentValue.count;
        previousValue.total += currentValue.count;
        return previousValue;
      },
      { total: 0 }
    );
  }
}

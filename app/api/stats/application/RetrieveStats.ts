import { Connection } from 'mongoose';
import { elastic } from 'api/search';

export class RetrieveStats {
  private readonly db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async execute() {
    const userStats = await this.calculateUserStats();
    const fileStats = await this.calculateFileStats();
    const entityStats = await this.calculateEntityStats();
    const storageStats = await this.calculateStorageStats();

    return { users: userStats, files: fileStats, entities: entityStats, storage: storageStats };
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

    const elasticIndex = await elastic.cat.indices({
      pretty: true,
      format: 'application/json',
      bytes: 'b',
      h: 'store.size',
    });

    const elasticSize = elasticIndex.body[0]['store.size'];

    return {
      total: parseInt(filesSize.totalSize, 10) + parseInt(elasticSize, 10),
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

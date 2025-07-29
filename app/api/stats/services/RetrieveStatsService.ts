import { Db } from 'mongodb';
import { elastic } from 'api/search';
import { UserSchema } from 'shared/types/userType';

type RoleCount = {
  _id: UserSchema['role'];
  count: number;
};

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

  private readonly NO_FILES_SIZE = 0;

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

    try {
      const elasticIndex = await elastic.cat.indices({
        pretty: true,
        bytes: 'b',
        h: 'store.size',
      });

      let elasticSize = 0;

      if (typeof elasticIndex.body === 'string') {
        // Plain text response (Elasticsearch 8.x behavior)
        const sizeStr = (elasticIndex.body as string).trim();
        elasticSize = parseInt(sizeStr, 10);
      } else if (
        elasticIndex.body &&
        Array.isArray(elasticIndex.body) &&
        elasticIndex.body[0] &&
        elasticIndex.body[0]['store.size']
      ) {
        // JSON response (Elasticsearch 7.x behavior)
        elasticSize = parseInt(elasticIndex.body[0]['store.size'], 10);
      } else {
        elasticSize = 0;
      }

      return {
        total: (filesSize?.totalSize || this.NO_FILES_SIZE) + elasticSize + dbStats.storageSize,
      };
    } catch (error) {
      return {
        total: (filesSize?.totalSize || this.NO_FILES_SIZE) + dbStats.storageSize,
      };
    }
  }

  private async calculateEntityStats() {
    return { total: await this.db.collection('entities').countDocuments() };
  }

  private async calculateFileStats() {
    return { total: await this.db.collection('files').countDocuments() };
  }

  private async calculateUserStats() {
    const users = await this.db
      .collection('users')
      .aggregate<RoleCount>([{ $group: { _id: '$role', count: { $sum: 1 } } }])
      .toArray();

    return users.reduce(
      (userStats, role) => {
        userStats[role._id] = role.count;
        userStats.total += role.count;
        return userStats;
      },
      { total: 0, admin: 0, editor: 0, collaborator: 0 }
    );
  }
}

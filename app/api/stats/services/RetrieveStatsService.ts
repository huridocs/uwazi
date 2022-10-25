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
    const elasticIndex = await elastic.cat.indices({
      pretty: true,
      format: 'application/json',
      bytes: 'b',
      h: 'store.size',
    });

    const elasticSize = parseInt(elasticIndex.body[0]['store.size'], 10);

    return {
      total: (filesSize?.totalSize || this.NO_FILES_SIZE) + elasticSize + dbStats.storageSize,
    };
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

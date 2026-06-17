import { Db } from 'mongodb';
import { elastic } from '#api/search/index.js';
import { PUBLIC_USER_ID } from '#api/users/publicUser.js';
import { UserSchema } from '#shared/types/userType.js';

type RoleCount = {
  _id: UserSchema['role'];
  count: number;
};

export class RetrieveStatsService {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async execute(language: string) {
    return {
      users: await this.calculateUserStats(),
      files: await this.calculateFileStats(),
      entities: await this.calculateEntityStats(language),
      storage: await this.calculateStorageStats(),
    };
  }

  private readonly NO_FILES_SIZE = 0;

  private static parseElasticSize(elasticBody: unknown) {
    if (typeof elasticBody === 'string') {
      // Plain text response (Elasticsearch 8.x behavior)
      const sizeStr = elasticBody.trim();
      return parseInt(sizeStr, 10);
    }

    if (
      Array.isArray(elasticBody) &&
      elasticBody[0] &&
      typeof elasticBody[0] === 'object' &&
      'store.size' in elasticBody[0]
    ) {
      // JSON response (Elasticsearch 7.x behavior)
      return parseInt((elasticBody[0] as Record<string, string>)['store.size'], 10);
    }

    return 0;
  }

  private static async getElasticStorageSize() {
    const elasticIndex = await elastic.cat.indices({
      pretty: true,
      bytes: 'b',
      h: 'store.size',
    });

    return RetrieveStatsService.parseElasticSize(elasticIndex.body);
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
    const baseSize = (filesSize?.totalSize || this.NO_FILES_SIZE) + dbStats.storageSize;

    try {
      const elasticSize = await RetrieveStatsService.getElasticStorageSize();
      return { total: baseSize + elasticSize };
    } catch (error) {
      return { total: baseSize };
    }
  }

  private async calculateEntityStats(language: string) {
    return {
      total: await this.db.collection('entities').countDocuments({ language }),
    };
  }

  private async calculateFileStats() {
    return { total: await this.db.collection('files').countDocuments() };
  }

  private async calculateUserStats() {
    const users = await this.db
      .collection('users')
      .aggregate<RoleCount>([
        { $match: { _id: { $ne: PUBLIC_USER_ID } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ])
      .toArray();

    return users.reduce(
      (userStats, role) => ({
        ...userStats,
        [role._id]: role.count,
        total: userStats.total + role.count,
      }),
      { total: 0, admin: 0, editor: 0, collaborator: 0 }
    );
  }
}

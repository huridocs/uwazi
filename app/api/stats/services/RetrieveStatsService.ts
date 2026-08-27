import { Db } from 'mongodb';
import { elastic } from '#api/search/index.js';
import { MongoFilesDAO } from '#api/core/infrastructure/mongodb/files/MongoFilesDAO.js';
import { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import type { UsersQueryService } from '#api/core/application/contracts/UsersQueryService.js';

export class RetrieveStatsService {
  /** Still a raw `Db`: `db.stats()` is a database-level call with no DAO behind it. */
  private readonly db: Db;

  private readonly filesDAO: MongoFilesDAO;

  private readonly entitiesDAO: EntitiesDAO;

  private readonly usersQueryService: UsersQueryService;

  constructor(
    db: Db,
    filesDAO: MongoFilesDAO,
    entitiesDAO: EntitiesDAO,
    usersQueryService: UsersQueryService
  ) {
    this.db = db;
    this.filesDAO = filesDAO;
    this.entitiesDAO = entitiesDAO;
    this.usersQueryService = usersQueryService;
  }

  async execute(language: string) {
    return {
      users: await this.calculateUserStats(),
      files: await this.calculateFileStats(),
      entities: await this.calculateEntityStats(language),
      storage: await this.calculateStorageStats(),
    };
  }

  private static parseElasticSize(elasticBody: unknown) {
    if (typeof elasticBody === 'string') {
      const sizeStr = elasticBody.trim();
      return parseInt(sizeStr, 10);
    }

    if (
      Array.isArray(elasticBody) &&
      elasticBody[0] &&
      typeof elasticBody[0] === 'object' &&
      'store.size' in elasticBody[0]
    ) {
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
    const filesSize = await this.filesDAO.getTotalFileSize();
    const dbStats = await this.db.stats();
    const baseSize = filesSize + dbStats.storageSize;

    try {
      const elasticSize = await RetrieveStatsService.getElasticStorageSize();
      return { total: baseSize + elasticSize };
    } catch (_) {
      return { total: baseSize };
    }
  }

  private async calculateEntityStats(_language: string) {
    return {
      total: await this.entitiesDAO.countDistinctSharedIds(),
    };
  }

  private async calculateFileStats() {
    return { total: await this.filesDAO.countDocuments() };
  }

  private async calculateUserStats() {
    const byRole = await this.usersQueryService.countByRole();

    return {
      ...byRole,
      total: Object.values(byRole).reduce((total, count) => total + count, 0),
    };
  }
}

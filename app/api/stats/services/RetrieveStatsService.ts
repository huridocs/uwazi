import { MongoFilesDAO } from '#api/core/infrastructure/mongodb/files/MongoFilesDAO.js';
import { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import type { UsersQueryService } from '#api/core/application/contracts/UsersQueryService.js';

export class RetrieveStatsService {
  private readonly filesDAO: MongoFilesDAO;

  private readonly entitiesDAO: EntitiesDAO;

  private readonly usersQueryService: UsersQueryService;

  constructor(
    filesDAO: MongoFilesDAO,
    entitiesDAO: EntitiesDAO,
    usersQueryService: UsersQueryService
  ) {
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

  private async calculateStorageStats() {
    return { total: await this.filesDAO.getTotalFileSize() };
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

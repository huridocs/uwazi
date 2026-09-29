import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';
import type { RoleCountsOutput } from '../contracts.js';
import { UserOutputs } from '../UserOutputs.js';

class UserStatsController {
  static async handle(): Promise<RoleCountsOutput> {
    return UserOutputs.roleCounts(await UsersQueryServiceFactory.default().countByRole());
  }
}

export { UserStatsController };

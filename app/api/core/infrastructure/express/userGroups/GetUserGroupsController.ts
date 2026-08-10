import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserGroupsDataSourceFactory } from '#api/core/infrastructure/factories/UserGroupsDataSourceFactory.js';
import type { GetUserGroupsResponse } from '#shared/contracts/UserGroups.js';
import { toDTO } from './UserGroupMapper.js';

class GetUserGroupsController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const groups = await UserGroupsDataSourceFactory.default().getAll();

      const response: GetUserGroupsResponse = groups.map(toDTO);
      this.response.json(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      ExecutionContext.logger.info(`User groups fetch failed: ${errorMessage}`, {
        namespace: 'UserGroup_Get',
        success: false,
        notify: true,
        error: JSON.stringify(error),
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }
}

export { GetUserGroupsController };

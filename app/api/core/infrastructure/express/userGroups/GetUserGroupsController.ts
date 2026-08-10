import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserGroupsDataSourceFactory } from '#api/core/infrastructure/factories/UserGroupsDataSourceFactory.js';
import { toDTO } from './UserGroupMapper.js';

class GetUserGroupsController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await UserGroupsDataSourceFactory.default().getAll();

      this.response.json(response.map(toDTO));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      ExecutionContext.logger.info(`User groups fetch failed: ${errorMessage}`, {
        namespace: 'UserGroup_Get',
        success: false,
        notify: true,
        durationMs: Date.now() - startTime,
        errorMessage,
        errorStack,
        errorType: error?.constructor?.name,
        tenantName: ExecutionContext.currentTenant.name,
        actorId: this.user._id,
        correlationId: ExecutionContext.correlationId,
      });

      throw error;
    }
  }
}

export { GetUserGroupsController };

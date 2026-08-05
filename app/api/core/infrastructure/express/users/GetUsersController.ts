import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GetUsersResponse } from '#shared/contracts/Users.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersQueryServiceFactory } from '../../factories/UsersQueryServiceFactory.js';

class GetUsersController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const queryService = UsersQueryServiceFactory.default();
      const users = await queryService.listWithGroups({});

      const response: GetUsersResponse = users.map(user => ({
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
        email: user.email,
        groups: user.groups,
        using2fa: user.using2fa,
        accountLocked: user.accountLocked,
      }));

      ExecutionContext.logger.info('Users retrieved successfully', {
        namespace: 'Users_Get',
        success: true,
        durationMs: Date.now() - startTime,
      });

      this.response.json(response);
    } catch (error) {
      ExecutionContext.logger.info(
        `Users retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Users_Get',
          success: false,
          error: JSON.stringify(error),
          notify: true,
        }
      );

      throw error;
    }
  }
}

export { GetUsersController };

import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class GetCurrentUserController extends AbstractController {
  protected async handle(): Promise<void> {
    try {
      this.response.json(this.request.user || {});
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Get current user failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Auth_GetCurrentUser',
          success: false,
          error: JSON.stringify(error),
          notify: true,
        }
      );

      throw error;
    }
  }
}

export { GetCurrentUserController };

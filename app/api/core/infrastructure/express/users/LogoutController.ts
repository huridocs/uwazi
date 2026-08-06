import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class LogoutController extends AbstractController {
  protected async handle(): Promise<void> {
    try {
      const userId = this.user.isAnonymous() ? undefined : this.user._id;

      ExecutionContext.logger.info('User logged out', {
        namespace: 'Auth_Logout',
        success: true,
        userId,
      });

      this.request.session.destroy(() => {});
      this.response.redirect('/');
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Auth_Logout',
          success: false,
          error: JSON.stringify(error),
          notify: true,
        }
      );

      throw error;
    }
  }
}

export { LogoutController };

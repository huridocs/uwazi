import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class LogoutController extends AbstractController {
  protected async handle(): Promise<void> {
    const userId = this.user.isAnonymous() ? undefined : this.user._id;

    ExecutionContext.logger.info('User logged out', {
      namespace: 'Auth',
      userId,
    });

    this.request.session.destroy(() => {});
    this.response.redirect('/');
  }
}

export { LogoutController };

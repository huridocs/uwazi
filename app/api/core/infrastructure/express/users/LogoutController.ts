import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';

class LogoutController extends AbstractController {
  protected async handle(): Promise<void> {
    this.request.session.destroy(() => {});
    this.response.redirect('/');
  }
}

export { LogoutController };

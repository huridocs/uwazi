import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';

class GetCurrentUserController extends AbstractController {
  protected async handle(): Promise<void> {
    this.response.json(this.request.user || {});
  }
}

export { GetCurrentUserController };

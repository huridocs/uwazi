import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GenerateCaptchaUseCaseFactory } from '#api/core/infrastructure/factories/CaptchaUseCaseFactories.js';

class CaptchaController extends AbstractController {
  protected async handle(): Promise<void> {
    const { svg, id } = await GenerateCaptchaUseCaseFactory.default().execute();

    this.response.json({ svg, id });
  }
}

export { CaptchaController };

import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { GenerateCaptchaUseCaseFactory } from '#api/core/infrastructure/factories/CaptchaUseCaseFactories.js';

class CaptchaController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const { svg, id } = await GenerateCaptchaUseCaseFactory.default().execute();

      ExecutionContext.logger.info('Captcha generated successfully', {
        namespace: 'Auth_Captcha',
        success: true,
        durationMs: Date.now() - startTime,
      });

      this.response.json({ svg, id });
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Captcha generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Auth_Captcha',
          success: false,
          error: JSON.stringify(error),
          notify: true,
        }
      );

      throw error;
    }
  }
}

export { CaptchaController };

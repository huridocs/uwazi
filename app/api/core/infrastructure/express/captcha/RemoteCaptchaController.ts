import urljoin from 'url-join';
import request from '#shared/JSONRequest.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

class RemoteCaptchaController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const { publicFormDestination } = await SettingsDataSourceFactory.default().get();
      const remoteResponse = await request.get(
        urljoin(publicFormDestination as string, '/api/captcha')
      );

      ExecutionContext.logger.info('Remote captcha fetched successfully', {
        namespace: 'Auth_Captcha',
        success: true,
        durationMs: Date.now() - startTime,
      });

      this.response.json(remoteResponse.json);
    } catch (error: unknown) {
      ExecutionContext.logger.info(
        `Remote captcha fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

export { RemoteCaptchaController };

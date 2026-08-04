import urljoin from 'url-join';
import request from '#shared/JSONRequest.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

class RemoteCaptchaController extends AbstractController {
  protected async handle(): Promise<void> {
    const { publicFormDestination } = await SettingsDataSourceFactory.default().get();
    const remoteResponse = await request.get(urljoin(publicFormDestination as string, '/api/captcha'));
    this.response.json(remoteResponse.json);
  }
}

export { RemoteCaptchaController };

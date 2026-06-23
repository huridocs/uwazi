import { DatavizController } from './DatavizController.js';
import { GetPublicDatavizEmbedUseCaseFactory } from '../factories/GetPublicDatavizEmbedUseCaseFactory.js';
import { renderDatavizEmbedHtml } from '#shared/dataviz/embed/renderDatavizEmbedHtml.js';
import { resolveDatavizEmbedScriptUrl } from '#shared/dataviz/embed/resolveDatavizEmbedScriptUrl.js';
import { mapDatavizEmbedHtmlErrors } from './mapDatavizEmbedHtmlErrors.js';

class DatavizEmbedHtmlController extends DatavizController {
  async handleAsync() {
    try {
      await this.handle();
    } catch (error) {
      if (mapDatavizEmbedHtmlErrors(error, this.response)) {
        return;
      }
      throw error;
    }
  }

  protected async handle(): Promise<void> {
    const useCase = GetPublicDatavizEmbedUseCaseFactory.default({ targetLanguage: this.language });
    const payload = await useCase.execute({ id: this.request.params.id! });
    const html = renderDatavizEmbedHtml({
      payload,
      language: this.language,
      embedScriptUrl: resolveDatavizEmbedScriptUrl(),
    });
    this.response.status(200).type('html').send(html);
  }
}

export { DatavizEmbedHtmlController };

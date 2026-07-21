import { DatavizController } from './DatavizController.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import { renderDatavizEmbedHtml } from '#shared/dataviz/embed/renderDatavizEmbedHtml.js';
import { resolveDatavizEmbedScriptUrl } from './resolveDatavizEmbedScriptUrl.js';
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
    const useCase = DatavizFactory.getPublicEmbedUseCase({ targetLanguage: this.language });
    const id = this.request.params.id!;
    const payload = await useCase.execute({ id });
    const parentOrigin =
      typeof this.request.query.parentOrigin === 'string'
        ? this.request.query.parentOrigin
        : undefined;

    const html = renderDatavizEmbedHtml({
      payload,
      language: this.language,
      datavizId: id,
      parentOrigin,
      embedScriptUrl: resolveDatavizEmbedScriptUrl(),
    });
    this.response.status(200).type('html').send(html);
  }
}

export { DatavizEmbedHtmlController };

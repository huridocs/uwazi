import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { toIndexedTranslations } from './MammothTranslationMapper.js';

const QuerySchema = z.object({
  context: z.string().optional(),
  locale: z.string().optional(),
});

/**
 * Thin GET for mammoth `/api/translations` — QueryService + DTO reshape, no UseCase.
 */
class GetTranslationsController extends AbstractController {
  protected async handle(): Promise<void> {
    const query = QuerySchema.parse(this.request.query);
    const service = TranslationsQueryServiceFactory.default();
    const rows = toIndexedTranslations(
      await service.getMammoth({
        context: query.context,
        locale: query.locale as LanguageISO6391 | undefined,
      })
    );
    this.response.json({ rows });
  }
}

export { GetTranslationsController };

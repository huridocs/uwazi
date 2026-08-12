import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { importPredefinedTranslations } from '#api/core/application/translation/ImportPredefinedTranslationsService.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';
import { createError } from '#api/utils/index.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { toIndexedTranslations } from './LegacyTranslationDtoMapper.js';

class PopulateTranslationsController extends AbstractController {
  protected async handle(): Promise<void> {
    const { locale } = this.request.body as { locale: LanguageISO6391 };

    try {
      await importPredefinedTranslations(locale);
    } catch (error) {
      if (error instanceof UITranslationNotAvailable) {
        throw createError(error, 422);
      }
      throw error;
    }

    // Stable contract: bare array (not `{ rows }`), matching historical populate response.
    this.response.json(
      toIndexedTranslations(await TranslationsQueryServiceFactory.default().getLegacy({ locale }))
    );
  }
}

export { PopulateTranslationsController };

import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { LanguageSchema } from '#shared/types/commonTypes.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { SettingsQueryServiceFactory } from '../../factories/SettingsQueryServiceFactory.js';
import { AddLanguageUseCaseFactory } from '../../factories/AddLanguageUseCaseFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';

const LanguageInputSchema = z.array(
  z.object({
    key: z.string(),
    label: z.string(),
  })
);

type RequestDto = { languages: z.infer<typeof LanguageInputSchema> };

class AddLanguageController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();

    try {
      const languages = LanguageInputSchema.parse(this.request?.body) as LanguageSchema[];
      const addedLanguages = await AddLanguageUseCaseFactory.default().execute({ languages });
      await this.emitLanguageAdded(addedLanguages);

      logger.info('Add language executed successfully', {
        namespace: 'Add_Language',
        success: true,
        keys: addedLanguages.map(l => l.key),
      });

      this.response.sendStatus(204);
    } catch (error: unknown) {
      logger.info(
        `Add language execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Add_Language',
          success: false,
          dto: JSON.stringify(this.request?.body || {}),
          error: JSON.stringify(error),
          notify: true,
        }
      );

      throw error;
    }
  }

  private async emitLanguageAdded(addedLanguages: LanguageSchema[]): Promise<void> {
    const query = TranslationsQueryServiceFactory.default();
    const translationPayloads = await Promise.all(
      addedLanguages.map(async language => query.getLegacy({ locale: language.key }))
    );
    translationPayloads.forEach(([newTranslations]) => {
      this.request.sockets.emitToCurrentTenant('translationsChange', newTranslations);
    });
    const newSettings = await SettingsQueryServiceFactory.default().getPublic();
    this.request.sockets.emitToCurrentTenant('updateSettings', newSettings);
    // translationsInstallDone is emitted by CloneLanguageEntitiesJob
  }
}

export { AddLanguageController };
export type { RequestDto as AddLanguageRequestDto };

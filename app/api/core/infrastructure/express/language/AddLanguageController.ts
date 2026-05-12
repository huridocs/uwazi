import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { LanguageSchema } from '#shared/types/commonTypes.js';
import settings from '#api/settings/index.js';
import translations from '#api/i18n/translations.js';
import { AddLanguageUseCaseFactory } from '../../factories/AddLanguageUseCaseFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';

const LanguageInputSchema = z.array(
  z.object({
    key: z.string(),
    label: z.string(),
    rtl: z.boolean().optional(),
    ISO639_3: z.string().optional(),
    localized_label: z.string().optional(),
  })
);

type RequestDto = { languages: z.infer<typeof LanguageInputSchema> };

class AddLanguageController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();

    try {
      const languages = LanguageInputSchema.parse(this.request?.body) as LanguageSchema[];
      const addedLanguages = await AddLanguageUseCaseFactory.default().execute({ languages });

      for (const language of addedLanguages) {
        // eslint-disable-next-line no-await-in-loop
        const [newTranslations] = await translations.get({ locale: language.key });
        this.request.sockets.emitToCurrentTenant('translationsChange', newTranslations);
      }
      const newSettings = await settings.get();
      this.request.sockets.emitToCurrentTenant('updateSettings', newSettings);
      // translationsInstallDone is emitted by CloneLanguageEntitiesJob

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
        }
      );

      throw error;
    }
  }
}

export { AddLanguageController };
export type { RequestDto as AddLanguageRequestDto };

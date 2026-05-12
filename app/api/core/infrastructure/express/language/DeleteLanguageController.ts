import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import settings from '#api/settings/index.js';
import { DeleteLanguageUseCaseFactory } from '../../factories/DeleteLanguageUseCaseFactory.js';
import { SettingsDataSourceFactory } from '../../factories/SettingsDataSourceFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';

const QuerySchema = z.object({
  key: z.string(),
});

type RequestDto = { key: string };

class DeleteLanguageController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const logger = LoggerFactory.default();

    const { key } = QuerySchema.parse(this.request?.query);

    const settingsDS = SettingsDataSourceFactory.default();
    const currentSettings = await settingsDS.get();
    const language = currentSettings.languages?.find(l => l.key === key);

    if (!language || language.installing) {
      this.response
        .status(409)
        .json({ error: 'Language is still being installed or does not exist' });
      return;
    }

    try {
      await DeleteLanguageUseCaseFactory.default().execute({ key: key as LanguageISO6391 });

      const newSettings = await settings.get();
      this.request.sockets.emitToCurrentTenant('updateSettings', newSettings);
      this.request.sockets.emitToCurrentTenant('translationsDelete', key);

      logger.info('Delete language executed successfully', {
        namespace: 'Delete_Language',
        success: true,
        key,
      });

      this.response.sendStatus(204);
    } catch (error: unknown) {
      logger.info(
        `Delete language execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Delete_Language',
          success: false,
          key,
          error: JSON.stringify(error),
        }
      );

      throw error;
    }
  }
}

export { DeleteLanguageController };
export type { RequestDto as DeleteLanguageRequestDto };

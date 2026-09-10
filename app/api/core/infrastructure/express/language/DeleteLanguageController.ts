import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { DeleteLanguageUseCaseFactory } from '../../factories/DeleteLanguageUseCaseFactory.js';
import { SettingsDataSourceFactory } from '../../factories/SettingsDataSourceFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';

const QuerySchema = z.object({
  key: z.string(),
});

type RequestDto = { key: string };

const isLanguageReadyToDelete = async (key: string) => {
  const languages = await SettingsDataSourceFactory.default().readLanguages();
  const language = languages?.find(item => item.key === key);
  return Boolean(language && !language.installing);
};

class DeleteLanguageController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const { key } = QuerySchema.parse(this.request?.query);
    if (await this.rejectIfNotReady(key)) {
      return;
    }
    await this.deleteLanguage(key);
  }

  private async rejectIfNotReady(key: string): Promise<boolean> {
    if (await isLanguageReadyToDelete(key)) {
      return false;
    }
    this.response
      .status(409)
      .json({ error: 'Language is still being installed or does not exist' });
    return true;
  }

  private async deleteLanguage(key: string): Promise<void> {
    const logger = LoggerFactory.default();
    try {
      await DeleteLanguageUseCaseFactory.default().execute({ key: key as LanguageISO6391 });
      this.request.sockets.emitToCurrentTenant('translationsDelete', key);
      this.response.sendStatus(204);
    } catch (error: unknown) {
      logger.info(
        `Delete language execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Delete_Language',
          success: false,
          key,
          error: JSON.stringify(error),
          notify: true,
        }
      );
      throw error;
    }
  }
}

export { DeleteLanguageController };
export type { RequestDto as DeleteLanguageRequestDto };

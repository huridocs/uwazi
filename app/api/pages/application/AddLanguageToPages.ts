import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PagesDataSource } from './contracts/PagesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
type Input = {
  language: LanguageISO6391;
  defaultLanguage: LanguageISO6391;
};

type Output = void;

type Deps = {
  pagesDS: PagesDataSource;
  settingsDS: SettingsDataSource;
};

class AddLanguageToPagesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<void> {
    const installedKeys = await this.deps.settingsDS.getLanguageKeys();
    if (!installedKeys.includes(input.language)) {
      throw new NonRetryableJobError(
        new Error(
          `Language "${input.language}" no longer exists in settings, skipping page locale creation.`
        )
      );
    }

    if (await this.deps.pagesDS.existsWithLocale(input.language)) {
      return;
    }

    const pages = await this.deps.pagesDS.getAll();

    await this.transactionManager.run(async () => {
      for (const page of pages) {
        page.addLocale(input.language, input.defaultLanguage);
        // eslint-disable-next-line no-await-in-loop
        await this.deps.pagesDS.update(page);
      }
    });
  }
}

export { AddLanguageToPagesUseCase };
export type { Input as AddLanguageToPagesInput };

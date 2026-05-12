import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { LanguageDeletedEvent } from '#api/core/domain/language/events/LanguageDeletedEvent.js';
import { AbstractUseCase } from '../libs/UseCase.js';

type Input = {
  key: LanguageISO6391;
};

type Output = void;

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
};

class DeleteLanguageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ key }: Input): Promise<Output> {
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();
    if (key === defaultLanguage) {
      throw new Error('Cannot delete the default language.');
    }

    await this.transactionManager.run(async () => {
      await this.deps.settingsDS.deleteLanguage(key);
      await this.deps.translationsDS.deleteByLanguage(key);
      await this.eventEmitter.emit(
        new LanguageDeletedEvent({ language: key, userId: this.actorId })
      );
      await this.dispatcher.deleteLanguageEntities({ language: key });
    });
  }
}

export { DeleteLanguageUseCase };
export type { Input as DeleteLanguageUseCaseInput };

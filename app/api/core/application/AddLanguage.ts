import { LanguageSchema } from '#shared/types/commonTypes.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import { AbstractUseCase } from '../libs/UseCase.js';

type Input = {
  languages: LanguageSchema[];
};

type Output = void;

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
};

class AddLanguageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ languages }: Input): Promise<Output> {
    await this.transactionManager.run(async () => {
      const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

      for (const language of languages) {
        // eslint-disable-next-line no-await-in-loop
        await this.deps.settingsDS.addLanguage(language);
        // eslint-disable-next-line no-await-in-loop
        await this.deps.translationsDS.cloneForLanguage(defaultLanguage, language.key);
        // eslint-disable-next-line no-await-in-loop
        await this.dispatcher.cloneLanguageEntities([{ from: defaultLanguage, to: language.key }]);
        // eslint-disable-next-line no-await-in-loop
        await this.eventEmitter.emit(
          new LanguageAddedEvent({
            language: language.key,
            defaultLanguage,
            userId: this.actorId,
          })
        );
      }
    });
  }
}

export { AddLanguageUseCase };
export type { Input as AddLanguageUseCaseInput };

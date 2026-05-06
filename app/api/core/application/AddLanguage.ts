/* eslint-disable no-await-in-loop */
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
      const installedKeys = new Set(await this.deps.settingsDS.getLanguageKeys());
      const newLanguages = [
        ...new Map(languages.filter(l => !installedKeys.has(l.key)).map(l => [l.key, l])).values(),
      ];

      if (newLanguages.length === 0) return;

      for (const language of newLanguages) {
        await this.deps.settingsDS.addLanguage(language);
        await this.deps.settingsDS.setLanguageInstalling(language.key, true);
        await this.deps.translationsDS.cloneForLanguage(defaultLanguage, language.key);
        await this.eventEmitter.emit(
          new LanguageAddedEvent({
            language: language.key,
            defaultLanguage,
            userId: this.actorId,
          })
        );
      }

      await this.dispatcher.cloneLanguageEntities({
        pairs: newLanguages.map(l => ({ from: defaultLanguage, to: l.key })),
      });

      for (const language of newLanguages) {
        await this.dispatcher.importPredefinedTranslations({ languageKey: language.key });
      }
    });
  }
}

export { AddLanguageUseCase };
export type { Input as AddLanguageUseCaseInput };

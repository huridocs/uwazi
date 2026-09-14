/* eslint-disable no-await-in-loop */
import { LanguageSchema } from '#shared/types/commonTypes.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { ImportPredefinedTranslations } from '#api/core/application/translation/ImportPredefinedTranslationsService.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { AbstractUseCase } from '../libs/UseCase.js';

type Input = {
  languages: LanguageSchema[];
};

type Output = LanguageSchema[];

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
  importPredefinedTranslations: ImportPredefinedTranslations;
};

class AddLanguageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ languages }: Input): Promise<Output> {
    const settings = await this.deps.settingsDS.get();
    const defaultLanguage = settings.defaultLanguageKey();
    const newLanguages = languages.filter(language => settings.addLanguage(language));

    if (newLanguages.length === 0) return [];

    newLanguages.forEach(language => {
      settings.setLanguageInstalling(language.key, true);
    });

    await this.transactionManager.run(async () => {
      await this.deps.settingsDS.update(settings);
      for (const language of newLanguages) {
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
        pairs: newLanguages.map(language => ({ from: defaultLanguage, to: language.key })),
      });
      await this.eventEmitter.emit(new SettingsChangedEvent({}));
    });

    for (const language of newLanguages) {
      await this.deps.importPredefinedTranslations.execute(language.key);
    }

    return newLanguages;
  }
}

export { AddLanguageUseCase };
export type { Input as AddLanguageUseCaseInput };

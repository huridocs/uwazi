import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import pages from './index.js';

type Deps = {
  settingsDS: SettingsDataSource;
};

class AddLanguagePagesListener extends Listener<LanguageAddedEvent, Deps> {
  static eventName = LanguageAddedEvent.name;

  protected async handle(): Promise<void> {
    const { language } = this.params;
    const installedKeys = await this.deps.settingsDS.getLanguageKeys();

    if (!installedKeys.includes(language)) {
      throw new NonRetryableJobError(
        new Error(`Language "${language}" no longer exists in settings, skipping page creation.`)
      );
    }

    await pages.addLanguage(language);
  }
}

EventEmitterFactory.registry.register(AddLanguagePagesListener);

export { AddLanguagePagesListener };

import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import pages from '#api/pages/index.js';
import translations from '#api/i18n/translations.js';
import { UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';

class AddLanguageListener extends Listener<LanguageAddedEvent> {
  static eventName = LanguageAddedEvent.name;

  protected async handle(): Promise<void> {
    const { language } = this.params;

    await pages.addLanguage(language);

    try {
      await translations.importPredefined(language);
    } catch (error) {
      if (!(error instanceof UITranslationNotAvailable)) {
        throw error;
      }
    }
  }
}

EventEmitterFactory.default().listen(AddLanguageListener);

export { AddLanguageListener };

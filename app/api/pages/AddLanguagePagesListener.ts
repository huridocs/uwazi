import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import pages from './index.js';

class AddLanguagePagesListener extends Listener<LanguageAddedEvent> {
  static eventName = LanguageAddedEvent.name;

  protected async handle(): Promise<void> {
    const { language } = this.params;
    await pages.addLanguage(language);
  }
}

EventEmitterFactory.registry.register(AddLanguagePagesListener);

export { AddLanguagePagesListener };

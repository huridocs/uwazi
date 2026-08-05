import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import { AddLanguageToPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/AddLanguageToPagesUseCaseFactory.js';

class AddLanguagePagesListener extends Listener<LanguageAddedEvent, {}> {
  static eventName = LanguageAddedEvent.name;

  protected async handle(): Promise<void> {
    const { language, defaultLanguage } = this.params;
    await AddLanguageToPagesUseCaseFactory.default().execute({ language, defaultLanguage });
  }
}

EventEmitterFactory.registry.register(AddLanguagePagesListener);

export { AddLanguagePagesListener };

import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LanguageDeletedEvent } from '#api/core/domain/language/events/LanguageDeletedEvent.js';
import { RemoveLanguageFromPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/RemoveLanguageFromPagesUseCaseFactory.js';

class DeleteLanguagePagesListener extends Listener<LanguageDeletedEvent, {}> {
  static eventName = LanguageDeletedEvent.name;

  protected async handle(): Promise<void> {
    const { language } = this.params;
    await RemoveLanguageFromPagesUseCaseFactory.default().execute({ language });
  }
}

EventEmitterFactory.registry.register(DeleteLanguagePagesListener);

export { DeleteLanguagePagesListener };

import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';
import { RequestEntityTranslation } from '../../RequestEntityTranslation';

export class ATEntityCreationListener {
  private requestEntityTranslation: RequestEntityTranslation;

  private eventBus: EventsBus;

  constructor(requestEntityTranslation: RequestEntityTranslation, eventBus: EventsBus) {
    this.requestEntityTranslation = requestEntityTranslation;
    this.eventBus = eventBus;
  }

  start() {
    this.eventBus.on(EntityCreatedEvent, async event => {
      const entityFrom = event.entities.find(e => e.language === event.targetLanguageKey) || {};

      entityFrom._id = entityFrom._id?.toString();
      entityFrom.template = entityFrom.template?.toString();

      await this.requestEntityTranslation.execute(entityFrom);
    });
  }
}

import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EntityCreatedEvent } from '#api/entities/events/EntityCreatedEvent.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { AutomaticTranslationFactory } from '../../AutomaticTranslationFactory.js';

export class ATEntityCreationListener {
  private eventBus: EventsBus;

  private ATFactory: typeof AutomaticTranslationFactory;

  constructor(
    eventBus: EventsBus,
    ATFactory: typeof AutomaticTranslationFactory = AutomaticTranslationFactory
  ) {
    this.eventBus = eventBus;
    this.ATFactory = ATFactory;
  }

  start() {
    this.eventBus.on(EntityCreatedEvent, async event => {
      const { active } = await this.ATFactory.defaultATConfigDataSource(
        TransactionManagerFactory.default()
      ).get();

      if (active) {
        const entityFrom = event.entities.find(e => e.language === event.targetLanguageKey) || {};

        entityFrom._id = entityFrom._id?.toString();
        entityFrom.template = entityFrom.template?.toString();

        await this.ATFactory.defaultRequestEntityTranslation().execute(entityFrom);
      }
    });
  }
}

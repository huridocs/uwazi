import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { EntityCreatedEvent } from '#api/entities/events/EntityCreatedEvent.js';

import { EventsBus } from '#api/eventsbus/index.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';

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


import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/events/EntityCreat... Remove this comment to see the full error message
import { EntityCreatedEvent } from '../entities/events/EntityCreatedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
import { AutomaticTranslationFactory } from '../../AutomaticTranslationFactory';

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
    // @ts-expect-error TS(7006): Parameter 'event' implicitly has an 'any' type.
    this.eventBus.on(EntityCreatedEvent, async event => {
      const { active } = await this.ATFactory.defaultATConfigDataSource(
        DefaultTransactionManager()
      ).get();

      if (active) {
        // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
        const entityFrom = event.entities.find(e => e.language === event.targetLanguageKey) || {};

        entityFrom._id = entityFrom._id?.toString();
        entityFrom.template = entityFrom.template?.toString();

        await this.ATFactory.defaultRequestEntityTranslation().execute(entityFrom);
      }
    });
  }
}

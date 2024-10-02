import { entityInputDataSchema } from 'api/entities.v2/EntityInputDataSchema';
import { EntityInputData } from 'api/entities.v2/EntityInputDataType';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { AutomaticTranslationFactory } from '../../AutomaticTranslationFactory';
import { validateInput } from '../../util/validateInput';

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
      const { active } = await this.ATFactory.defaultATConfigService().get();

      if (active) {
        permissionsContext.setCommandContext();
        const entityFrom = event.entities.find(e => e.language === event.targetLanguageKey) || {};

        entityFrom._id = entityFrom._id?.toString();
        entityFrom.template = entityFrom.template?.toString();

        validateInput<EntityInputData>(entityInputDataSchema, entityFrom);
        await this.ATFactory.defaultRequestEntityTranslation().execute(entityFrom);
      }
    });
  }
}

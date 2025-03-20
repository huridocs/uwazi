import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';

export class PXEntityCreationListener {
  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private async afterEntityCreation(data: EntityCreatedEvent['data']) {
    // call use case
    console.log(data);
  }

  start() {
    this.eventBus.on(EntityCreatedEvent, this.afterEntityCreation.bind(this));
  }
}

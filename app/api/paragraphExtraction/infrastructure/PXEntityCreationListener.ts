import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';

import { PXCreateEntityStatusFactory } from './PXCreateEntityStatusFactory';

export class PXEntityCreationListener {
  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private static async afterEntityCreation(data: EntityCreatedEvent['data']) {
    const useCase = PXCreateEntityStatusFactory.createDefault();
    const [sourceEntity] = data.entities;

    await useCase.execute({
      entitySharedId: sourceEntity.sharedId!,
      sourceTemplateId: sourceEntity.template!.toString(),
    });
  }

  start() {
    this.eventBus.on(EntityCreatedEvent, PXEntityCreationListener.afterEntityCreation.bind(this));
  }
}

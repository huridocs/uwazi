import { LogEntityCreatedUseCase } from '#api/core/application/LogEntityCreated.js';
import { EntityCreatedEvent } from '#api/core/domain/entity/EntityCreatedEvent.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';

class LogEntityCreatedListener extends Listener<EntityCreatedEvent> {
  static eventName = EntityCreatedEvent.name;

  protected async handle(): Promise<void> {
    const useCase = new LogEntityCreatedUseCase({});

    await useCase.execute({ sharedId: this.params.sharedId });
  }
}

EventEmitterFactory.registry.register(LogEntityCreatedListener);

export { LogEntityCreatedListener };

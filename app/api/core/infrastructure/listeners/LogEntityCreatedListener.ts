import { LogEntityCreatedUseCase } from 'api/core/application/LogEntityCreated';
import { EntityCreatedEvent } from 'api/core/domain/entity/EntityCreatedEvent';
import { Listener } from 'api/core/libs/eventEmitter/Listener';

class LogEntityCreatedListener extends Listener<EntityCreatedEvent> {
  static eventName = EntityCreatedEvent.name;

  protected async handle(): Promise<void> {
    const useCase = new LogEntityCreatedUseCase({});

    await useCase.execute({ sharedId: this.params.sharedId });
  }
}

export { LogEntityCreatedListener };

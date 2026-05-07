import { EntityCreatedEvent } from '#api/core/domain/entity/EntityCreatedEvent.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { ProvisionEntityAccessPolicyUseCaseFactory } from '../factories/ProvisionEntityAccessPolicyUseCaseFactory.js';

class ProvisionEntityAccessPolicyOnCreationListener extends Listener<EntityCreatedEvent> {
  static eventName = EntityCreatedEvent.name;

  protected async handle(): Promise<void> {
    const useCase = ProvisionEntityAccessPolicyUseCaseFactory.default();
    await useCase.execute({ sharedId: this.params.sharedId, creatorId: this.userId });
  }
}

EventEmitterFactory.registry.register(ProvisionEntityAccessPolicyOnCreationListener);

export { ProvisionEntityAccessPolicyOnCreationListener };

import { Listener } from 'api/core/libs/eventEmitter/Listener';
import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { EntityUpdatedEvent } from 'api/core/domain/entity/EntityUpdatedEvent';
import { Entity } from 'api/core/domain/entity/Entity';
import relationships from 'api/relationships';
import { MongoEntityMapper } from '../mongodb/entity/MongoEntityMapper';
import { MongoTemplateMapper } from '../mongodb/template/MongoTemplateMapper';

class ProcessRelationshipAfterEntityUpdatedListener extends Listener<EntityUpdatedEvent> {
  static eventName = EntityUpdatedEvent.name;

  protected async handle(): Promise<void> {
    const afterEntity = new Entity(this.params.after);

    const afterEntityDbos = MongoEntityMapper.toDBO(afterEntity);

    const targetEntityDboAfter = afterEntityDbos.find(
      dbo => dbo.language === this.params.targetLanguage
    );

    if (!targetEntityDboAfter) {
      throw new Error(
        `Denormalization failed: could not find entity DBO for language ${this.params.targetLanguage}`
      );
    }

    const template = MongoTemplateMapper.toSchema(afterEntity.template);

    await relationships.saveEntityBasedReferences(
      targetEntityDboAfter,
      this.params.targetLanguage,
      template
    );
  }
}

EventEmitterFactory.default().listen(ProcessRelationshipAfterEntityUpdatedListener);

export { ProcessRelationshipAfterEntityUpdatedListener };

import { Listener } from 'api/core/libs/eventEmitter/Listener';
import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { EntityUpdatedEvent } from 'api/core/domain/entity/EntityUpdatedEvent';
import { Entity } from 'api/core/domain/entity/Entity';
import relationships from 'api/relationships';
import { MongoEntityMapper } from '../mongodb/entity/MongoEntityMapper';
import { MongoTemplateMapper } from '../mongodb/template/MongoTemplateMapper';
import { TemplatesDataSourceFactory } from '../factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from '../factories/TransactionManagerFactory';

class ProcessRelationshipAfterEntityUpdatedListener extends Listener<EntityUpdatedEvent> {
  static eventName = EntityUpdatedEvent.name;

  protected async handle(): Promise<void> {
    const templateDS = TemplatesDataSourceFactory.default(TransactionManagerFactory.default());

    const template = (await templateDS.getById(this.params.after.templateId)).getDataOrThrow();

    const afterEntity = new Entity({ template, ...this.params.after });

    const afterEntityDbos = MongoEntityMapper.toDBO(afterEntity);

    const targetEntityDboAfter = afterEntityDbos.find(
      dbo => dbo.language === this.params.targetLanguage
    );

    if (!targetEntityDboAfter) {
      throw new Error(
        `ProcessRelationshipAfterEntityUpdatedListener: failed to process relationships - could not find entity DBO for language ${this.params.targetLanguage}`
      );
    }

    await relationships.saveEntityBasedReferences(
      targetEntityDboAfter,
      this.params.targetLanguage,
      MongoTemplateMapper.toSchema(afterEntity.template)
    );
  }
}

EventEmitterFactory.default().listen(ProcessRelationshipAfterEntityUpdatedListener);

export { ProcessRelationshipAfterEntityUpdatedListener };

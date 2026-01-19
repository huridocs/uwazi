import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { Entity, EntityIcon } from '../domain/entity/Entity';
import { SettingsDataSource } from './contracts/SettingsDataSource';
import { TemplatesDataSource } from './contracts/TemplatesDataSource';
import { EventsBus } from '../libs/eventsbus';
import { TransactionManager } from './contracts/TransactionManager';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher';
import { RelationshipSyncJob } from '../infrastructure/jobs/RelationshipSyncJob';

type CreateInput = {
  icon?: EntityIcon;
  userId?: string;
  templateId?: string;
};

type Deps = {
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  eventBus: EventsBus;
  transactionManager: TransactionManager;
  dispatcher: JobsDispatcher;
};

type InsertContext = {
  tenantName: string;
  actorId: string;
};

class EntitiesService {
  constructor(private deps: Deps) {}

  async create({ templateId, userId, icon }: CreateInput) {
    const [template, languages] = await Promise.all([
      this.getTemplateByIdOrDefault(templateId),
      this.deps.settingsDS.getLanguageKeys(),
    ]);

    return Entity.create({
      languages,
      userId,
      template,
      icon,
    });
  }

  async insert(entity: Entity, context: InsertContext) {
    await this.deps.entitiesDS.create(entity);

    await this.deps.dispatcher.dispatch(RelationshipSyncJob, {
      sharedId: entity.sharedId,
      targetLanguage: entity.languages[0],
      templateId: entity.template.id,
      tenantName: context.tenantName,
      userId: context.actorId,
    });

    this.deps.transactionManager.onCommitted(async () => {
      await this.deps.eventBus.emit(EntityCreatedEvent.fromEntity(entity, entity.languages[0]));
    });
  }

  async bulkInsert(entities: Entity[], context: InsertContext) {
    await this.deps.entitiesDS.bulkInsert(entities);

    await this.deps.dispatcher.dispatchMany(async dispatch => {
      entities.forEach(entity => {
        dispatch(RelationshipSyncJob, {
          sharedId: entity.sharedId,
          targetLanguage: entity.languages[0],
          templateId: entity.template.id,
          tenantName: context.tenantName,
          userId: context.actorId,
        });
      });
    });

    this.deps.transactionManager.onCommitted(async () => {
      await Promise.all(
        entities.map(async entity =>
          this.deps.eventBus.emit(EntityCreatedEvent.fromEntity(entity, entity.languages[0]))
        )
      );
    });
  }

  private async getTemplateByIdOrDefault(templateId?: string) {
    if (templateId) {
      return (await this.deps.templatesDS.getById(templateId)).getDataOrThrow();
    }

    return (await this.deps.templatesDS.getDefaultTemplate()).getDataOrThrow();
  }
}

export { EntitiesService };

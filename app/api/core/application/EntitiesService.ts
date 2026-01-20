import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { EntityCreatedEvent } from '#api/entities/events/EntityCreatedEvent.js';
import { Entity, EntityIcon } from '#api/core/domain/entity/Entity.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { RelationshipSyncJob } from '#api/core/infrastructure/jobs/RelationshipSyncJob.js';

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

  private async getTemplateByIdOrDefault(templateId?: string) {
    if (templateId) {
      return (await this.deps.templatesDS.getById(templateId)).getDataOrThrow();
    }

    return (await this.deps.templatesDS.getDefaultTemplate()).getDataOrThrow();
  }
}

export { EntitiesService };

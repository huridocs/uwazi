import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { search } from 'api/search';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { User } from 'api/users.v2/model/User';
import { Entity, EntityIcon } from '../domain/entity/Entity';
import { SettingsDataSource } from './contracts/SettingsDataSource';
import { TemplatesDataSource } from './contracts/TemplatesDataSource';
import { EventsBus } from '../libs/eventsbus';
import { TransactionManager } from './contracts/TransactionManager';
import { JobsDispatcher } from '../libs/queue/application/contracts/JobsDispatcher';
import { RelationshipSyncJob } from '../infrastructure/jobs/RelationshipSyncJob';
import { BulkCleanupEntityJob } from '../infrastructure/jobs/BulkCleanupEntityJob';
import { EntityPermissionChecker, Specification } from '../domain/entity/EntityPermissionChecker';

type CreateInput = {
  icon?: EntityIcon;
  userId?: string;
  templateId?: string;
};

type CreateManyInput = CreateInput & {
  count: number;
};

type Deps = {
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  eventBus: EventsBus;
  transactionManager: TransactionManager;
  dispatcher: JobsDispatcher;
  search: typeof search;
  entityPermissionChecker: EntityPermissionChecker;
};

type InsertContext = {
  tenantName: string;
  actorId: string;
};

type DeleteContext = {
  tenantName: string;
  actor: User;
};

class EntitiesService {
  constructor(private deps: Deps) {}

  private ensureTransaction() {
    if (!this.deps.transactionManager.isRunning()) {
      throw new Error('This operation must be called within a transaction');
    }
  }

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

  async createMany({ templateId, userId, icon, count }: CreateManyInput) {
    if (count <= 0) {
      return [];
    }
    const [template, languages] = await Promise.all([
      this.getTemplateByIdOrDefault(templateId),
      this.deps.settingsDS.getLanguageKeys(),
    ]);

    return Array.from({ length: count }, () =>
      Entity.create({
        languages,
        userId,
        template,
        icon,
      })
    );
  }

  async insert(entity: Entity, context: InsertContext) {
    this.ensureTransaction();

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
    this.ensureTransaction();

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

  async bulkDelete(sharedIds: string[], context: DeleteContext) {
    this.ensureTransaction();

    if (sharedIds.length === 0) {
      return;
    }

    const grantedSharedIds = (
      await this.deps.entityPermissionChecker.filterEntities(
        sharedIds,
        Specification.createDeleteSpecification(context.actor)
      )
    ).getDataOrThrow();

    const chunks = ArrayUtils.splitInChunks(grantedSharedIds, 100);

    await this.deps.dispatcher.dispatchMany(async dispatch =>
      chunks.forEach(chunk =>
        dispatch(BulkCleanupEntityJob, {
          sharedIds: chunk,
          userId: context.actor._id,
          tenantName: context.tenantName,
        })
      )
    );

    await this.deps.entitiesDS.bulkDelete(grantedSharedIds);
    await this.deps.search.bulkDeleteBySharedId(grantedSharedIds);
  }

  private async getTemplateByIdOrDefault(templateId?: string) {
    if (templateId) {
      return (await this.deps.templatesDS.getById(templateId)).getDataOrThrow();
    }

    return (await this.deps.templatesDS.getDefaultTemplate()).getDataOrThrow();
  }
}

export { EntitiesService };
export type { Deps as EntitiesServiceDeps };

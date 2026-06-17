import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { EntityCreatedEvent } from '#api/entities/events/EntityCreatedEvent.js';
import { EntityUpdatedEvent as LegacyEntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { User } from '#api/users.v2/model/User.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Entity, EntityIcon } from '../domain/entity/Entity.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { EventsBus } from '../libs/eventsbus/index.js';
import { TransactionManager } from './contracts/TransactionManager.js';
import { Dispatcher } from './contracts/Dispatcher.js';
import {
  EntityPermissionChecker,
  Specification,
} from '../domain/entityAccessPolicy/EntityPermissionChecker.js';
import { EntityUpdatedEvent } from '../domain/entity/EntityUpdatedEvent.js';
import { MongoEntityMapper } from '../infrastructure/mongodb/entity/MongoEntityMapper.js';
import { EventEmitter } from '../libs/eventEmitter/EventEmitter.js';
import { EntityAccessPolicy } from '../domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyDataSource } from './contracts/EntityAccessPolicyDataSource.js';

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
  dispatcher: Dispatcher;
  entityPermissionChecker: EntityPermissionChecker;
  eventEmitter: EventEmitter;
  entityAccessPolicyDS: EntityAccessPolicyDataSource;
};

type InsertContext = {
  tenantName: string;
  actorId: string;
  targetLanguage: LanguageISO6391;
};

type UpsertContext = {
  actorId: string;
  targetLanguage: LanguageISO6391;
  authorize?: boolean;
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

  async insert(entity: Entity, context: InsertContext) {
    this.ensureTransaction();
    await this.deps.entitiesDS.create(entity);

    await this.deps.entityAccessPolicyDS.create(
      EntityAccessPolicy.createForNewEntity(entity.sharedId, context.actorId)
    );

    await this.deps.dispatcher.syncRelationships([
      {
        sharedId: entity.sharedId,
        targetLanguage: entity.languages[0],
        templateId: entity.template.id,
        tenantName: context.tenantName,
        userId: context.actorId,
      },
    ]);

    this.deps.transactionManager.onCommitted(async () => {
      await this.deps.eventBus.emit(EntityCreatedEvent.fromEntity(entity, context.targetLanguage));
    });
  }

  async bulkInsert(entities: Entity[], context: InsertContext) {
    this.ensureTransaction();

    await this.deps.entitiesDS.bulkInsert(entities);

    await this.deps.entityAccessPolicyDS.bulkCreate(
      entities.map(e => EntityAccessPolicy.createForNewEntity(e.sharedId, context.actorId))
    );

    await this.deps.dispatcher.syncRelationships(
      entities.map(entity => ({
        sharedId: entity.sharedId,
        targetLanguage: context.targetLanguage,
        templateId: entity.template.id,
        tenantName: context.tenantName,
        userId: context.actorId,
      }))
    );

    this.deps.transactionManager.onCommitted(async () => {
      await Promise.all(
        entities.map(async entity =>
          this.deps.eventBus.emit(EntityCreatedEvent.fromEntity(entity, context.targetLanguage))
        )
      );
    });
  }

  async update(entity: Entity, context: UpsertContext) {
    this.ensureTransaction();

    if (!entity.hasChanged) return;

    await this.deps.entitiesDS.update(entity);

    await this.deps.eventEmitter.emit(
      EntityUpdatedEvent.create({
        entity,
        targetLanguage: context.targetLanguage,
        userId: context.actorId,
      })
    );

    await this.deps.eventBus.emit(
      new LegacyEntityUpdatedEvent({
        before: MongoEntityMapper.toDBO(entity.previousVersion) as any,
        after: MongoEntityMapper.toDBO(entity) as any,
        targetLanguageKey: context.targetLanguage,
      })
    );
  }

  async updateMultiple(entities: Entity[], context: UpsertContext) {
    this.ensureTransaction();

    const changedEntities = entities.filter(e => e.hasChanged);
    if (changedEntities.length === 0) return;

    await this.deps.entitiesDS.bulkUpdate(changedEntities);

    await Promise.all(
      changedEntities.map(async entity =>
        this.deps.eventEmitter.emit(
          EntityUpdatedEvent.create({
            entity,
            targetLanguage: context.targetLanguage,
            userId: context.actorId,
          })
        )
      )
    );

    await Promise.all(
      changedEntities.map(async entity =>
        this.deps.eventBus.emit(
          new LegacyEntityUpdatedEvent({
            before: MongoEntityMapper.toDBO(entity.previousVersion) as any,
            after: MongoEntityMapper.toDBO(entity) as any,
            targetLanguageKey: context.targetLanguage,
          })
        )
      )
    );
  }

  async bulkDelete(sharedIds: string[], context: DeleteContext): Promise<string[]> {
    this.ensureTransaction();

    if (sharedIds.length === 0) {
      return [];
    }

    const grantedSharedIds = await this.deps.entityPermissionChecker.filterEntities(
      sharedIds,
      Specification.createDeleteSpecification(context.actor)
    );

    if (grantedSharedIds.length === 0) {
      return [];
    }

    const chunks = ArrayUtils.splitInChunks(grantedSharedIds, 100);

    await this.deps.dispatcher.cleanupEntities(
      chunks.map(chunk => ({
        sharedIds: chunk,
        userId: context.actor._id,
        tenantName: context.tenantName,
      }))
    );

    await this.deps.entitiesDS.bulkDelete(grantedSharedIds);

    return grantedSharedIds;
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

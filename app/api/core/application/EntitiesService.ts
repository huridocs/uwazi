/* eslint-disable max-statements */
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
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
  entitiesDS: EntitiesDataSource;
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
  actor: User;
  targetLanguage: LanguageISO6391;
  authorize?: boolean;
};

type DeleteContext = {
  tenantName: string;
  actor: User;
};

const isNoEventListenersError = (error: unknown) =>
  error instanceof Error && error.message.startsWith('There are no listeners for event ');

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

  async insert(entities: Entity[], context: InsertContext) {
    this.ensureTransaction();
    if (entities.length === 0) return;

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

  async update(entities: Entity[], context: UpsertContext): Promise<string[]> {
    this.ensureTransaction();
    if (entities.length === 0) return [];

    let authorized = entities;
    if (context.authorize !== false) {
      const grantedIds = await this.deps.entityPermissionChecker.filterEntities(
        entities.map(e => e.sharedId),
        Specification.createWriteSpecification(context.actor)
      );
      authorized = entities.filter(e => grantedIds.includes(e.sharedId));
    }

    const changedEntities = authorized.filter(e => e.hasChanged);
    if (changedEntities.length === 0) return [];

    await this.deps.entitiesDS.bulkUpdate(changedEntities);

    const updatedSharedIds = changedEntities.map(e => e.sharedId);

    await Promise.all(
      changedEntities.map(async entity => {
        try {
          await this.deps.eventEmitter.emit(
            EntityUpdatedEvent.create({
              entity,
              targetLanguage: context.targetLanguage,
              userId: context.actorId,
            })
          );
        } catch (error) {
          if (!isNoEventListenersError(error)) {
            throw error;
          }
        }
      })
    );

    this.deps.transactionManager.onCommitted(async () => {
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
    });

    return updatedSharedIds;
  }

  async delete(sharedIds: string[], context: DeleteContext): Promise<string[]> {
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

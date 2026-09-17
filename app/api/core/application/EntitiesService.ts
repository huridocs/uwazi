/* eslint-disable max-statements */
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import {
  EntityCreatedEvent,
  ProvidedTranslations,
} from '#api/entities/events/EntityCreatedEvent.js';
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
  PermissionSpec,
} from '../domain/entityAccessPolicy/EntityPermissionChecker.js';
import { EntityUpdatedEvent } from '../domain/entity/EntityUpdatedEvent.js';
import { EventEmitter } from '../libs/eventEmitter/EventEmitter.js';
import { EntityAccessPolicy } from '../domain/entityAccessPolicy/EntityAccessPolicy.js';
import { EntityAccessPolicyDataSource } from './contracts/EntityAccessPolicyDataSource.js';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import {
  MissingTranslationLanguageError,
  TargetLanguageInTranslationsError,
  UnknownTranslationLanguageError,
} from './errors.js';

type TranslationsInput = Partial<Record<LanguageISO6391, PropertyAssignmentInput[]>>;

type ValidateTranslationLanguagesParams = {
  targetLanguage: LanguageISO6391;
  translations: TranslationsInput;
  partial?: boolean;
};

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
  providedTranslations?: ProvidedTranslations;
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

  /**
   * `translations` may only hold installed languages other than the target language. Unless `partial`,
   * every installed language must be present, except languages still being installed.
   */
  async validateTranslationLanguages({
    targetLanguage,
    translations,
    partial = false,
  }: ValidateTranslationLanguagesParams): Promise<void> {
    const installed = (await this.deps.settingsDS.readLanguages()) ?? [];
    const sent = Object.keys(translations);

    const unknown = sent.find(language => !installed.some(({ key }) => key === language));
    if (unknown) throw new UnknownTranslationLanguageError(unknown);

    if (sent.includes(targetLanguage)) throw new TargetLanguageInTranslationsError(targetLanguage);

    if (partial) return;

    const missing = installed.find(
      ({ key, installing }) => key !== targetLanguage && !installing && !sent.includes(key)
    );
    if (missing) throw new MissingTranslationLanguageError(missing.key);
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
      }))
    );

    this.deps.transactionManager.onCommitted(async () => {
      await Promise.all(
        entities.map(async entity =>
          this.deps.eventBus.emit(
            EntityCreatedEvent.fromEntity(
              entity,
              context.targetLanguage,
              context.providedTranslations
            )
          )
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
        PermissionSpec.createWriteSpecification(context.actor)
      );
      authorized = entities.filter(e => grantedIds.includes(e.sharedId));
    }

    const changedEntities = authorized.filter(e => e.hasChanged);
    if (changedEntities.length === 0) return [];

    await this.deps.entitiesDS.update(changedEntities);

    const updatedSharedIds = changedEntities.map(e => e.sharedId);

    await Promise.all(
      changedEntities
        .map(entity =>
          EntityUpdatedEvent.create({
            entity,
            userId: context.actorId,
            targetLanguage: context.targetLanguage,
          })
        )
        .filter(event => event !== null)
        .map(async event => this.deps.eventEmitter.emit(event))
    );

    this.deps.transactionManager.onCommitted(async () => {
      await Promise.all(
        changedEntities.map(async entity =>
          this.deps.eventBus.emit(
            LegacyEntityUpdatedEvent.fromEntity({ entity, targetLanguage: context.targetLanguage })
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
      PermissionSpec.createDeleteSpecification(context.actor)
    );

    if (grantedSharedIds.length === 0) {
      return [];
    }

    const chunks = ArrayUtils.splitInChunks(grantedSharedIds, 100);

    await this.deps.dispatcher.cleanupEntities(
      chunks.map(chunk => ({
        sharedIds: chunk,
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
export type { Deps as EntitiesServiceDeps, TranslationsInput };

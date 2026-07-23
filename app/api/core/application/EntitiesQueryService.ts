/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-params */
/* eslint-disable max-lines */
/* eslint-disable max-statements */
import { User } from '#api/users.v2/model/User.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import {
  EntityPermissionChecker,
  Specification,
} from '../domain/entityAccessPolicy/EntityPermissionChecker.js';
import { PropertyTypeEnum } from '../domain/template/PropertyType.js';
import { Template } from '../domain/template/Template.js';
import type {
  EntityWithFiles,
  MongoEntitiesDAO,
} from '../infrastructure/mongodb/entity/MongoEntitiesDAO.js';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { FileDTO } from '../domain/files/domainTypes.js';
import { GetEntityResponseDTO, RelationDTO } from './GetEntityResponseDTO.js';
import { EntityNotFoundError } from '../domain/entity/errors.js';
import { AccessLevel } from '../domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '../domain/entityAccessPolicy/GrantType.js';
import { TimedMethod } from '../libs/logger/TimedMethodDecorator.js';
import { ExecutionContext } from '../libs/ExecutionContext.js';

type Deps = {
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entityPermissionChecker: EntityPermissionChecker;
  entityDAO: MongoEntitiesDAO;
  relationshipsDataSource: MongoRelationshipsV1DataSource;
};

class EntitiesQueryService {
  constructor(private deps: Deps) {}

  private addTelemetry(metadata: Record<string, any>): void {
    if (!ExecutionContext.getStore()) return;
    ExecutionContext.telemetryCollector.add(metadata);
  }

  /**
   * Gets a single entity with all computed fields (files, relationships, filtered metadata).
   */
  @TimedMethod('EntitiesQueryService.getEntity')
  async getEntity(input: {
    sharedId: string;
    language: LanguageISO6391;
    includeRelationships: boolean;
    includePermissions: boolean;
    user: User;
  }): Promise<GetEntityResponseDTO> {
    const { sharedId, language, includeRelationships, includePermissions, user } = input;
    const isAuthenticated = !user.isAnonymous();

    const [entity] = await this.deps.entityDAO.getWithFiles({
      sharedId,
      language,
    });

    if (!entity) {
      throw new EntityNotFoundError(sharedId);
    }

    this.addTelemetry({
      isAuthenticated,
      includeRelationships,
      includePermissions,
      documentsCount: entity.documents.length,
      attachmentsCount: entity.attachments.length,
    });

    await this.applyRelationshipPermissions([entity], user);

    let filteredRelations: RelationDTO[] = [];
    if (includeRelationships) {
      const includeUnpublished = isAuthenticated;
      const relations = (await this.deps.relationshipsDataSource.getByEntity(
        sharedId,
        language,
        includeUnpublished
      )) as RelationDTO[];

      filteredRelations = isAuthenticated
        ? relations
        : relations.filter(rel => rel.entityData?.published !== false);

      this.addTelemetry({
        relationsCount: relations.length,
        filteredRelationsCount: filteredRelations.length,
      });
    }

    await this.applyPermissionsFieldSecurity(entity, user, includePermissions);

    const response: GetEntityResponseDTO = {
      ...entity,
      documents: entity.documents.map(doc => ({ ...doc, _id: doc._id.toString() }) as FileDTO),
      attachments: entity.attachments.map(doc => ({ ...doc, _id: doc._id.toString() }) as FileDTO),
      ...(includeRelationships && { relations: filteredRelations }),
    };

    return response;
  }

  /**
   * Applies relationship permissions to entity metadata based on user permissions.
   * Mutates entity metadata in-place by filtering or marking inaccessible relationship references.
   */
  @TimedMethod('EntitiesQueryService.applyRelationshipPermissions')
  async applyRelationshipPermissions(entityDBOs: EntityDBO[], user: User): Promise<void> {
    if (entityDBOs.length === 0) {
      return;
    }

    const templatePropsMap = await this.loadTemplateRelationshipProperties(entityDBOs);
    const relationshipPropsCount = [...templatePropsMap.values()].reduce(
      (count, props) => count + props.size,
      0
    );
    const referencedEntityIds = this.findAllReferencedEntities(entityDBOs, templatePropsMap);
    const accessibleEntityIds = await this.determineAccessibleEntities(referencedEntityIds, user);
    const filterUnauthorized = await this.deps.settingsDS.readFilterUnauthorizedRelated();

    this.addTelemetry({
      relationshipPropsCount,
      referencedEntityIdsCount: referencedEntityIds.size,
      accessibleEntityIdsCount: accessibleEntityIds.size,
      filterUnauthorized,
    });

    this.applyPermissionsToMetadata(
      entityDBOs,
      templatePropsMap,
      accessibleEntityIds,
      filterUnauthorized,
      user
    );
  }

  @TimedMethod('EntitiesQueryService.applyPermissionsFieldSecurity')
  private async applyPermissionsFieldSecurity(
    entity: EntityWithFiles,
    user: User,
    includePermissions: boolean
  ): Promise<void> {
    if (!includePermissions || user.isAnonymous()) {
      delete entity.permissions;
      return;
    }

    if (user.isPrivileged()) return;

    if (entity.published) return;

    const userIds = [user._id, ...user.groups];
    const hasWrite =
      Array.isArray(entity.permissions) &&
      entity.permissions.some((p: any) => {
        const refId = p.refId?.toString?.() ?? p.refId;
        return p.level === AccessLevel.Write && userIds.includes(refId);
      });

    if (!hasWrite) delete entity.permissions;
  }

  @TimedMethod('EntitiesQueryService.loadTemplateRelationshipProperties')
  private async loadTemplateRelationshipProperties(
    entityDBOs: EntityDBO[]
  ): Promise<Map<string, Set<string>>> {
    const templateIds = [...new Set(entityDBOs.map(e => e.template.toString()))];
    const templates = await this.deps.templatesDS.getByIds(templateIds);

    this.validateAllTemplatesLoaded(templates, templateIds);

    const templatePropsMap = new Map<string, Set<string>>();

    for (const template of templates) {
      const relationshipProps = new Set(
        template.properties.filter(p => p.type === PropertyTypeEnum.Relationship).map(p => p.name)
      );
      templatePropsMap.set(template.id, relationshipProps);
    }

    return templatePropsMap;
  }

  private validateAllTemplatesLoaded(templates: Template[], requestedIds: string[]): void {
    if (templates.length !== requestedIds.length) {
      const foundIds = new Set(templates.map(t => t.id));
      const missingIds = requestedIds.filter(id => !foundIds.has(id));
      throw new Error(`Templates not found: ${missingIds.join(', ')}`);
    }
  }

  private findAllReferencedEntities(
    entityDBOs: EntityDBO[],
    templatePropsMap: Map<string, Set<string>>
  ): Set<string> {
    const allReferencedIds = new Set<string>();

    for (const entityDBO of entityDBOs) {
      const relationshipProps = templatePropsMap.get(entityDBO.template.toString());

      if (relationshipProps && relationshipProps.size > 0) {
        for (const propName of relationshipProps) {
          const values = entityDBO.metadata?.[propName];

          if (Array.isArray(values)) {
            values.forEach(v => {
              if (v?.value && typeof v.value === 'string') {
                allReferencedIds.add(v.value);
              }
            });
          }
        }
      }
    }

    return allReferencedIds;
  }

  @TimedMethod('EntitiesQueryService.determineAccessibleEntities')
  private async determineAccessibleEntities(
    referencedIds: Set<string>,
    user: User
  ): Promise<Set<string>> {
    if (referencedIds.size === 0) {
      return new Set();
    }

    const spec = new Specification({
      type: GrantType.User,
      level: AccessLevel.Read,
      actor: user,
    });

    const accessibleIds = await this.deps.entityPermissionChecker.filterEntities(
      Array.from(referencedIds),
      spec
    );

    return new Set(accessibleIds);
  }

  private applyPermissionsToMetadata(
    entityDBOs: EntityDBO[],
    templatePropsMap: Map<string, Set<string>>,
    accessibleIds: Set<string>,
    filterUnauthorized: boolean,
    user: User
  ): void {
    for (const entityDBO of entityDBOs) {
      this.applyPermissionsToSingleEntity(
        entityDBO,
        templatePropsMap,
        accessibleIds,
        filterUnauthorized,
        user
      );
    }
  }

  private applyPermissionsToSingleEntity(
    entityDBO: EntityDBO,
    templatePropsMap: Map<string, Set<string>>,
    accessibleIds: Set<string>,
    filterUnauthorized: boolean,
    user: User
  ): void {
    const templateId = entityDBO.template.toString();
    const relationshipProps = templatePropsMap.get(templateId);

    if (!relationshipProps || relationshipProps.size === 0 || !entityDBO.metadata) {
      return;
    }

    for (const propName of relationshipProps) {
      const values = entityDBO.metadata[propName];

      if (Array.isArray(values)) {
        entityDBO.metadata[propName] = this.filterRelationshipValues(
          values,
          accessibleIds,
          filterUnauthorized,
          user
        );
      }
    }
  }

  private filterRelationshipValues(
    values: any[],
    accessibleIds: Set<string>,
    filterUnauthorized: boolean,
    user: User
  ): any[] {
    const shouldRemoveInaccessible = filterUnauthorized && user.isAnonymous();

    if (shouldRemoveInaccessible) {
      return values.filter(
        v => v?.value && typeof v.value === 'string' && accessibleIds.has(v.value)
      );
    }

    return values.map(v => {
      if (v?.value && typeof v.value === 'string' && !accessibleIds.has(v.value)) {
        return { ...v, authorized: false };
      }
      return v;
    });
  }
}

export { EntitiesQueryService };
export type { Deps as EntitiesQueryServiceDeps };

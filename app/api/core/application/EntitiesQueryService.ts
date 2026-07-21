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
import {
  EntityWithFiles,
  MongoEntitiesDAO,
} from '../infrastructure/mongodb/entity/MongoEntitiesDAO.js';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { FileDTO } from '../domain/files/domainTypes.js';
import { GetEntityResponseDTO, RelationDTO } from './GetEntityResponseDTO.js';
import { EntityNotFoundError } from '../domain/entity/errors.js';
import { AccessLevel } from '../domain/entityAccessPolicy/AccessLevel.js';
import { GrantType } from '../domain/entityAccessPolicy/GrantType.js';

type Deps = {
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entityPermissionChecker: EntityPermissionChecker;
  entityDAO: MongoEntitiesDAO;
  relationshipsDataSource: MongoRelationshipsV1DataSource;
};

type GetEntityPerformance = {
  entityLoadMs: number;
  permFilterMs: number;
  relationsMs: number;
  relatedCount: number;
  relationshipPropValueCount: number;
};

type GetEntityResult = {
  entity: GetEntityResponseDTO;
  phases: GetEntityPerformance;
};

function countRelationshipPropValues(
  entityDBOs: EntityDBO[],
  templatePropsMap: Map<string, Set<string>>
): number {
  let count = 0;

  for (const entityDBO of entityDBOs) {
    const relationshipProps = templatePropsMap.get(entityDBO.template.toString());
    if (relationshipProps) {
      for (const propName of relationshipProps) {
        const values = entityDBO.metadata?.[propName];
        if (Array.isArray(values)) {
          count += values.length;
        }
      }
    }
  }

  return count;
}

class EntitiesQueryService {
  constructor(private deps: Deps) {}

  /**
   * Gets a single entity with all computed fields (files, relationships, filtered metadata).
   */
  async getEntity(input: {
    sharedId: string;
    language: LanguageISO6391;
    includeRelationships: boolean;
    includePermissions: boolean;
    user: User;
  }): Promise<GetEntityResult> {
    const { sharedId, language, includeRelationships, includePermissions, user } = input;
    const isAuthenticated = !user.isAnonymous();

    const entityLoadStart = performance.now();
    const [entity] = await this.deps.entityDAO.getWithFiles({
      sharedId,
      language,
    });
    const entityLoadMs = performance.now() - entityLoadStart;

    if (!entity) {
      throw new EntityNotFoundError(sharedId);
    }

    const permFilterStart = performance.now();
    const relationshipPropValueCount = await this.applyRelationshipPermissions([entity], user);
    const permFilterMs = performance.now() - permFilterStart;

    let filteredRelations: RelationDTO[] = [];
    const relationsStart = performance.now();
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
    }
    const relationsMs = performance.now() - relationsStart;

    this.applyPermissionsFieldSecurity(entity, user, includePermissions);

    const response: GetEntityResponseDTO = {
      ...entity,
      documents: entity.documents.map(doc => ({ ...doc, _id: doc._id.toString() }) as FileDTO),
      attachments: entity.attachments.map(doc => ({ ...doc, _id: doc._id.toString() }) as FileDTO),
      ...(includeRelationships && { relations: filteredRelations }),
    };

    return {
      entity: response,
      phases: {
        entityLoadMs,
        permFilterMs,
        relationsMs,
        relatedCount: filteredRelations.length,
        relationshipPropValueCount,
      },
    };
  }

  /**
   * Applies relationship permissions to entity metadata based on user permissions.
   * Mutates entity metadata in-place by filtering or marking inaccessible relationship references.
   * @returns count of relationship property values after filtering
   */
  async applyRelationshipPermissions(entityDBOs: EntityDBO[], user: User): Promise<number> {
    if (entityDBOs.length === 0) {
      return 0;
    }

    const templatePropsMap = await this.loadTemplateRelationshipProperties(entityDBOs);
    const referencedEntityIds = this.findAllReferencedEntities(entityDBOs, templatePropsMap);
    const accessibleEntityIds = await this.determineAccessibleEntities(referencedEntityIds, user);
    const filterUnauthorized = await this.deps.settingsDS.readFilterUnauthorizedRelated();

    this.applyPermissionsToMetadata(
      entityDBOs,
      templatePropsMap,
      accessibleEntityIds,
      filterUnauthorized,
      user
    );

    return countRelationshipPropValues(entityDBOs, templatePropsMap);
  }

  private applyPermissionsFieldSecurity(
    entity: EntityWithFiles,
    user: User,
    includePermissions: boolean
  ): void {
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

    if (!relationshipProps || relationshipProps.size === 0) {
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
export type { Deps as EntitiesQueryServiceDeps, GetEntityPerformance, GetEntityResult };

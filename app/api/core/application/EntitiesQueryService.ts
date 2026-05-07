import { User } from '#api/users.v2/model/User.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import {
  EntityPermissionChecker,
  Specification,
} from '../domain/entity/EntityPermissionChecker.js';
import { PropertyTypeEnum } from '../domain/template/PropertyType.js';
import { AccessLevel } from '../domain/entity/AccessLevel.js';
import { PermissionType } from '../domain/entity/PermissionType.js';
import { Template } from '../domain/template/Template.js';
import {
  EntityWithFiles,
  MongoEntityDAO,
} from '../infrastructure/mongodb/entity/MongoEntityDAO.js';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { GetEntityResponseDTO, RelationDTO } from './GetEntityResponseDTO.js';
import { EntityNotFoundError } from '../domain/entity/errors.js';
import { EntityAccessPolicyDataSource } from './contracts/EntityAccessPolicyDataSource.js';

type Deps = {
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entityPermissionChecker: EntityPermissionChecker;
  entityDAO: MongoEntityDAO;
  relationshipsDataSource: MongoRelationshipsV1DataSource;
  entityAccessPolicyDS: EntityAccessPolicyDataSource;
};

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
  }): Promise<GetEntityResponseDTO> {
    const { sharedId, language, includeRelationships, includePermissions, user } = input;
    const isAuthenticated = !user.isAnonymous();

    const entity = await this.deps.entityDAO
      .getWithFiles({
        sharedId,
        language,
      })
      .next();

    if (!entity) {
      throw new EntityNotFoundError(sharedId);
    }

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
    }

    await this.applyPermissionsFieldSecurity(entity, user, includePermissions);

    const response: GetEntityResponseDTO = {
      ...entity,
      documents: entity.documents.map(doc => ({ ...doc, _id: doc._id.toString() })),
      attachments: entity.attachments.map(doc => ({ ...doc, _id: doc._id.toString() })),
      ...(includeRelationships && { relations: filteredRelations }),
    };

    return response;
  }

  /**
   * Applies relationship permissions to entity metadata based on user permissions.
   * Mutates entity metadata in-place by filtering or marking inaccessible relationship references.
   */
  async applyRelationshipPermissions(entityDBOs: EntityDBO[], user: User): Promise<void> {
    if (entityDBOs.length === 0) {
      return;
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
  }

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

    const policyResult = await this.deps.entityAccessPolicyDS.getBySharedId(entity.sharedId);

    if (policyResult.isError()) {
      // Policy not yet provisioned — treat as private
      delete entity.permissions;
      return;
    }

    const policy = policyResult.getData();

    if (policy.allowsPublicRead()) return;

    const hasWrite = policy.allowsUserWrite(user._id, user.groups);

    if (!hasWrite) delete entity.permissions;
  }

  private async loadTemplateRelationshipProperties(
    entityDBOs: EntityDBO[]
  ): Promise<Map<string, Set<string>>> {
    const templateIds = [...new Set(entityDBOs.map(e => e.template.toString()))];
    const templates = await this.deps.templatesDS.getByIds(templateIds).all();

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
      type: PermissionType.User,
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
export type { Deps as EntitiesQueryServiceDeps };

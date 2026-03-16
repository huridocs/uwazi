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
import { MongoEntityDAO } from '../infrastructure/mongodb/entity/MongoEntityDAO.js';
import { MongoRelationshipsV1DataSource } from '../infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { GetEntityResponseDTO, RelationDTO } from './GetEntityResponseDTO.js';
import { fileDBO, fileDTO } from '../infrastructure/mongodb/files/schemas/filesTypes.js';
import { EntityNotFoundError } from '../domain/entity/errors.js';

type Deps = {
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entityPermissionChecker: EntityPermissionChecker;
  entityDAO: MongoEntityDAO;
  relationshipsDataSource: MongoRelationshipsV1DataSource;
};

/**
 * Query service for read-only entity operations.
 *
 * This service is optimized for performance and follows CQRS pattern
 * by separating read operations from write operations (EntitiesService).
 */
class EntitiesQueryService {
  constructor(private deps: Deps) {}

  /**
   * Gets a single entity with all computed fields (files, relationships, filtered metadata).
   *
   * @param input - Query parameters
   * @returns Entity with all computed fields, or null if not found/unauthorized
   * @throws EntityNotFoundError if entity doesn't exist or user lacks permission
   */
  async getEntity(input: {
    sharedId: string;
    language: LanguageISO6391;
    includeRelationships: boolean;
    user?: User;
  }): Promise<GetEntityResponseDTO> {
    const { sharedId, language, includeRelationships, user } = input;
    const isAuthenticated = !!user;

    const entity = await this.deps.entityDAO
      .getWithFiles({
        sharedId,
        language,
      })
      .next();

    if (!entity) {
      throw new EntityNotFoundError(sharedId);
    }

    if (!isAuthenticated && entity.published === false) {
      throw new EntityNotFoundError(sharedId);
    }

    // Security: Check READ permissions for unpublished entities (non-privileged users)
    if (entity.published === false && user && !user.isPrivileged()) {
      const hasReadPermission = await this.deps.entityPermissionChecker.checkReadPermission(
        sharedId,
        user
      );
      if (!hasReadPermission.getDataOrThrow()) {
        throw new EntityNotFoundError(sharedId);
      }
    }

    await this.applyRelationshipPermissions([entity], user);

    let filteredRelations: RelationDTO[] = [];
    if (includeRelationships) {
      const includeUnpublished = isAuthenticated ?? false;
      const relations = (await this.deps.relationshipsDataSource.getByEntity(
        sharedId,
        language,
        includeUnpublished
      )) as RelationDTO[];

      filteredRelations = isAuthenticated
        ? relations
        : relations.filter(rel => rel.entityData?.published !== false);
    }

    const response: GetEntityResponseDTO = {
      ...entity,
      documents: this.convertFilesToDTO(entity.documents),
      attachments: this.convertFilesToDTO(entity.attachments),
      ...(includeRelationships && { relations: filteredRelations }),
    };

    return response;
  }

  private convertFilesToDTO(files: fileDBO[]): fileDTO[] {
    return files.map(file => ({
      ...file,
      _id: file._id.toString(),
    })) as fileDTO[];
  }

  /**
   * Applies relationship permissions to entity metadata based on user permissions.
   * Mutates entity metadata in-place by filtering or marking inaccessible relationship references.
   *
   * @param entityDBOs - Array of entity database objects to process (mutated in-place)
   * @param user - Optional authenticated user for permission checking
   */
  async applyRelationshipPermissions(entityDBOs: EntityDBO[], user?: User): Promise<void> {
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

  private async loadTemplateRelationshipProperties(
    entityDBOs: EntityDBO[]
  ): Promise<Map<string, Set<string>>> {
    const templateIds = [...new Set(entityDBOs.map(e => e.template.toString()))];
    const templates = await this.deps.templatesDS.getByIds(templateIds).all();

    this.validateAllTemplatesLoaded(templates, templateIds);

    return this.buildRelationshipPropertyMap(templates);
  }

  private validateAllTemplatesLoaded(templates: Template[], requestedIds: string[]): void {
    if (templates.length !== requestedIds.length) {
      const foundIds = new Set(templates.map(t => t.id));
      const missingIds = requestedIds.filter(id => !foundIds.has(id));
      throw new Error(`Templates not found: ${missingIds.join(', ')}`);
    }
  }

  private buildRelationshipPropertyMap(templates: Template[]): Map<string, Set<string>> {
    const templatePropsMap = new Map<string, Set<string>>();

    for (const template of templates) {
      const relationshipProps = new Set(
        template.properties.filter(p => p.type === PropertyTypeEnum.Relationship).map(p => p.name)
      );
      templatePropsMap.set(template.id, relationshipProps);
    }

    return templatePropsMap;
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
    user?: User
  ): Promise<Set<string>> {
    if (referencedIds.size === 0) {
      return new Set();
    }

    const referencedArray = Array.from(referencedIds);
    const accessibleIds = user
      ? await this.getEntitiesUserCanRead(referencedArray, user)
      : await this.getPublishedEntities(referencedArray);

    return new Set(accessibleIds);
  }

  private async getEntitiesUserCanRead(entityIds: string[], user: User): Promise<string[]> {
    const spec = new Specification({
      type: PermissionType.User,
      level: AccessLevel.Read,
      actor: user,
    });

    const result = await this.deps.entityPermissionChecker.filterEntities(entityIds, spec);
    return result.isOk() ? result.getData() : [];
  }

  private async getPublishedEntities(entityIds: string[]): Promise<string[]> {
    const result = await this.deps.entityPermissionChecker.getPublishedEntities(entityIds);
    return result.isOk() ? result.getData() : [];
  }

  private applyPermissionsToMetadata(
    entityDBOs: EntityDBO[],
    templatePropsMap: Map<string, Set<string>>,
    accessibleIds: Set<string>,
    filterUnauthorized: boolean,
    user?: User
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
    user?: User
  ): void {
    const templateId = entityDBO.template.toString();
    const relationshipProps = templatePropsMap.get(templateId);

    if (!relationshipProps || relationshipProps.size === 0) {
      return;
    }

    if (!entityDBO.metadata) {
      entityDBO.metadata = {};
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
    user?: User
  ): any[] {
    const shouldRemoveInaccessible = filterUnauthorized && !user;

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

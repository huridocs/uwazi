import { User } from '#api/users.v2/model/User.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
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

type Deps = {
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entityPermissionChecker: EntityPermissionChecker;
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
   * Authorizes relationship properties in entity metadata based on user permissions.
   *
   * High-level flow:
   * 1. Load templates and identify which properties are relationships
   * 2. Collect all entity IDs referenced in relationship properties
   * 3. Check permissions for all referenced entities in one batch query
   * 4. Filter/mark inaccessible references based on user type and settings
   *
   * @param entityDBOs - Array of entity database objects to filter
   * @param user - Optional authenticated user for permission checking
   * @returns Map of sharedId to filtered metadata
   */
  async authorizeRelationshipProperties(
    entityDBOs: EntityDBO[],
    user?: User
  ): Promise<Map<string, Record<string, any>>> {
    if (entityDBOs.length === 0) {
      return new Map();
    }

    // Step 1: Load templates and discover which properties contain relationships
    const templatePropsMap = await this.loadTemplateRelationshipProperties(entityDBOs);

    // Step 2: Find all entities referenced across all relationship properties
    const referencedEntityIds = this.findAllReferencedEntities(entityDBOs, templatePropsMap);

    // Step 3: Determine which referenced entities the user can access (batch query)
    const accessibleEntityIds = await this.determineAccessibleEntities(referencedEntityIds, user);

    // Step 4: Apply authorization rules to each entity's metadata
    const filterUnauthorized = await this.deps.settingsDS.readFilterUnauthorizedRelated();
    return this.filterMetadataByAccess(
      entityDBOs,
      templatePropsMap,
      accessibleEntityIds,
      filterUnauthorized,
      user
    );
  }

  /**
   * Loads templates for all entities and extracts which properties are relationships.
   * Uses a single batch query for optimal performance.
   */
  private async loadTemplateRelationshipProperties(
    entityDBOs: EntityDBO[]
  ): Promise<Map<string, Set<string>>> {
    const templateIds = [...new Set(entityDBOs.map(e => e.template.toString()))];
    const templates = await this.deps.templatesDS.getByIds(templateIds).all();

    this.validateAllTemplatesLoaded(templates, templateIds);

    return this.buildRelationshipPropertyMap(templates);
  }

  /**
   * Validates that all requested templates were successfully loaded.
   * @throws Error if any templates are missing
   */
  private validateAllTemplatesLoaded(templates: Template[], requestedIds: string[]): void {
    if (templates.length !== requestedIds.length) {
      const foundIds = new Set(templates.map(t => t.id));
      const missingIds = requestedIds.filter(id => !foundIds.has(id));
      throw new Error(`Templates not found: ${missingIds.join(', ')}`);
    }
  }

  /**
   * Builds a map from template ID to set of relationship property names.
   */
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

  /**
   * Finds all entity IDs referenced in relationship properties across all entities.
   */
  private findAllReferencedEntities(
    entityDBOs: EntityDBO[],
    templatePropsMap: Map<string, Set<string>>
  ): Set<string> {
    const allReferencedIds = new Set<string>();

    for (const entityDBO of entityDBOs) {
      const relationshipProps = templatePropsMap.get(entityDBO.template.toString());

      if (!relationshipProps || relationshipProps.size === 0) {
        continue;
      }

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

    return allReferencedIds;
  }

  /**
   * Determines which referenced entities are accessible to the user.
   * Performs a single batch permission check for optimal performance.
   */
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

  /**
   * Gets entities that an authenticated user has read access to.
   */
  private async getEntitiesUserCanRead(entityIds: string[], user: User): Promise<string[]> {
    const spec = new Specification({
      type: PermissionType.User,
      level: AccessLevel.Read,
      actor: user,
    });

    const result = await this.deps.entityPermissionChecker.filterEntities(entityIds, spec);
    return result.isOk() ? result.getData() : [];
  }

  /**
   * Gets entities that are publicly accessible (published).
   */
  private async getPublishedEntities(entityIds: string[]): Promise<string[]> {
    const result = await this.deps.entityPermissionChecker.getPublishedEntities(entityIds);
    return result.isOk() ? result.getData() : [];
  }

  /**
   * Filters entity metadata based on accessible entities.
   * Either removes inaccessible references or marks them with authorized: false.
   */
  private filterMetadataByAccess(
    entityDBOs: EntityDBO[],
    templatePropsMap: Map<string, Set<string>>,
    accessibleIds: Set<string>,
    filterUnauthorized: boolean,
    user?: User
  ): Map<string, Record<string, any>> {
    const resultMap = new Map<string, Record<string, any>>();

    for (const entityDBO of entityDBOs) {
      const filteredMetadata = this.filterSingleEntityMetadata(
        entityDBO,
        templatePropsMap,
        accessibleIds,
        filterUnauthorized,
        user
      );

      resultMap.set(entityDBO.sharedId, filteredMetadata);
    }

    return resultMap;
  }

  /**
   * Filters metadata for a single entity.
   */
  private filterSingleEntityMetadata(
    entityDBO: EntityDBO,
    templatePropsMap: Map<string, Set<string>>,
    accessibleIds: Set<string>,
    filterUnauthorized: boolean,
    user?: User
  ): Record<string, any> {
    const templateId = entityDBO.template.toString();
    const relationshipProps = templatePropsMap.get(templateId)!;
    const filteredMetadata = { ...(entityDBO.metadata || {}) };

    for (const propName of relationshipProps) {
      const values = filteredMetadata[propName];

      if (Array.isArray(values)) {
        filteredMetadata[propName] = this.filterRelationshipValues(
          values,
          accessibleIds,
          filterUnauthorized,
          user
        );
      }
    }

    return filteredMetadata;
  }

  /**
   * Filters values in a relationship property.
   * Unauthenticated + filterUnauthorized: removes inaccessible references.
   * All other cases: marks inaccessible references with authorized: false.
   */
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

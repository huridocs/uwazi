import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { Property } from '#api/core/domain/template/Property.js';
import { ResultType } from '#api/core/libs/Result.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntityNotFoundError } from '#api/core/application/errors.js';

/**
 * Data source for entity persistence and retrieval.
 *
 * Permission enforcement is backend-specific:
 *
 * - **Mongo** — each instance carries its own `AccessContext`, captured at
 *   construction. An instance created with `AccessContext.system()` sees all
 *   entities; one created with an actor context enforces read/write
 *   permissions. Because the context is per-instance, mixing enforced and
 *   unrestricted instances in the same use case is safe even when operations
 *   run concurrently.
 *
 * - **Postgres** — enforcement is row-level security (RLS) configured on the
 *   shared `PostgresTransactionManager` via a mutable permission context that
 *   is read at transaction start. An unrestricted instance must set `bypass`
 *   on that transaction manager before each operation. Sequential
 *   interleaving of enforced and unrestricted operations works correctly
 *   (each operation re-sets the RLS config immediately before its query), but
 *   **concurrent** operations on the same transaction manager can race — one
 *   operation may read the other's permission context. Avoid `Promise.all`
 *   over operations that mix enforced and unrestricted instances on the same
 *   transaction manager.
 */
export interface EntitiesDataSource {
  /**
   * Returns a view of this data source that bypasses permission enforcement.
   *
   * Use it only for existence checks (e.g. distinguishing "entity does not
   * exist" from "entity exists but the actor cannot read it"). Never use the
   * returned instance's data for denormalization or anything that could leak
   * information the actor is not allowed to see.
   *
   * **Postgres caveat:** bypassing permissions is dangerous when run inside a
   * transaction manager transaction and in parallel. The RLS permission
   * context lives on the shared transaction manager, so concurrent operations
   * mixing enforced and unrestricted instances can race — one operation may
   * read the other's permission context. Avoid `Promise.all` over such mixed
   * operations; sequential interleaving is safe.
   */
  unrestricted(): EntitiesDataSource;

  bulkUpdateDeprecated(entitiesToSave: Entity[], properties: Property[]): Promise<void>;
  bulkUpdate(entities: Entity[]): Promise<void>;
  update(entity: Entity): Promise<void>;

  deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void>;
  touchEntitiesBySharedIds(sharedIds: string[]): Promise<void>;
  bulkDelete(sharedIds: string[]): Promise<void>;
  deleteReferencesToSharedIds(sharedIds: string[]): Promise<void>;

  renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void>;

  countByTemplateId(templateId: string): Promise<number>;

  getById(id: string): Promise<ResultType<Entity, EntityNotFoundError>>;
  existsByIdAndTemplateId(id: string, templateId: string): Promise<boolean>;
  getEntitiesByTemplateId(templateId: string): Promise<ResultSet<Entity>>;
  getEntitiesBySharedIds(sharedIds: string[]): Promise<ResultSet<Entity>>;
  getSharedIdsByTemplateId(templateId: string): Promise<ResultSet<string>>;
  getAllBySharedId(sharedIds: string[]): Promise<ResultType<Entity[], Error>>; // Todo: Replace by domain error
  getEntitiesByRelatedProperties(
    entities: Entity[],
    properties: V1RelationshipProperty[]
  ): Promise<ResultSet<Entity>>;
  getSharedIdsByTemplateAndTitles(
    templateId: string,
    titles: string[]
  ): Promise<Array<{ title: string; sharedId: string }>>;
  getSharedIdsByTitles(
    titles: string[]
  ): Promise<Array<{ title: string; sharedId: string; templateId: string }>>;
  getSharedIdsUsingThesaurus(thesaurusId: string): Promise<string[]>;

  create(entity: Entity): Promise<void>;
  bulkInsert(entities: Entity[]): Promise<void>;
}

import { Db, ObjectId } from 'mongodb';
import {
  processRelationshipCollection,
  withConnectedData,
} from '#api/relationships/relationshipProcessing.js';
import type { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type {
  DeleteResult,
  EntityReferenceByRelationshipType,
  FindOptions,
  HubConnection,
  HubConnectionsOptions,
  Relation,
  RelationshipPropertyHubCandidate,
  RelationshipQuery,
  RelationshipsV1DataSource,
  RelationshipSourceEntity,
  RelationshipUpdate,
  SearchHub,
  V1Relationship,
} from '#shared/contracts/RelationshipsV1DataSource.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { PostgresRelationshipMapper } from './PostgresRelationshipMapper.js';
import { PostgresRelationshipRow } from './PostgresRelationshipRow.js';

const MERGE_COLUMNS = [
  'entity',
  'hub',
  'template',
  'file',
  'metadata',
  'reference',
  'sharedId',
  'filename',
  'range',
];

export class PostgresRelationshipsV1DataSource
  extends PostgresDataSource<PostgresRelationshipRow>
  implements RelationshipsV1DataSource
{
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
    entitiesDAO: EntitiesDAO;
    settingsDS: SettingsDataSource;
  }) {
    super('connections', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'connections' },
    });
    this.entitiesDAO = deps.entitiesDAO;
    this.settingsDS = deps.settingsDS;
  }

  private readonly entitiesDAO: EntitiesDAO;

  private readonly settingsDS: SettingsDataSource;

  async find(query: RelationshipQuery = {}, options: FindOptions = {}): Promise<V1Relationship[]> {
    let table = this.applyQuery(query);
    if (options.limit) {
      table = table.limit(options.limit);
    }
    const rows = await table.all();
    return rows.map(PostgresRelationshipMapper.toV1Relationship);
  }

  async findById(id: string): Promise<V1Relationship | null> {
    const row = await this.table.where({ _id: id }).first();
    return row ? PostgresRelationshipMapper.toV1Relationship(row) : null;
  }

  async count(query: RelationshipQuery = {}): Promise<number> {
    return this.applyQuery(query).count();
  }

  async getHubConnections(
    entitiesSharedIds: string[],
    options: HubConnectionsOptions = {}
  ): Promise<V1Relationship[]> {
    const { file, onlyTextReferences } = options;
    const bindings: unknown[] = [];
    let ownSql = `SELECT "hub" FROM connections WHERE "entity" IN (${PostgresRelationshipsV1DataSource.placeholders(
      entitiesSharedIds.length
    )})`;
    bindings.push(...entitiesSharedIds);

    if (onlyTextReferences) {
      ownSql += ` AND "file" IS NOT NULL AND "file" = ?`;
      bindings.push(file);
      ownSql += ` LIMIT 300`;
    } else if (file) {
      ownSql += ` AND ("file" IS NULL OR "file" = ?)`;
      bindings.push(file);
    }

    const ownRows = await this.rawRows<{ hub: string | null }>(ownSql, bindings);
    const hubIds = [...new Set(ownRows.map(row => row.hub).filter((id): id is string => !!id))];
    if (hubIds.length === 0) {
      return [];
    }

    const rows = await this.rawRows<PostgresRelationshipRow>(
      `SELECT * FROM connections WHERE "hub" IN (${PostgresRelationshipsV1DataSource.placeholders(hubIds.length)})`,
      hubIds
    );
    return rows.map(PostgresRelationshipMapper.toV1Relationship);
  }

  async saveMultiple(documents: Partial<V1Relationship>[]): Promise<V1Relationship[]> {
    if (documents.length === 0) {
      return [];
    }

    const rows = documents.map(document => PostgresRelationshipMapper.toRow(document));
    await this.table.upsert(rows, {
      columns: ['_id', 'tenant_id'],
      merge: MERGE_COLUMNS,
    });

    const ids = rows.map(row => row._id);
    const saved = await this.table.whereIn('_id', ids).all();
    return saved.map(PostgresRelationshipMapper.toV1Relationship);
  }

  async delete(query: RelationshipQuery): Promise<DeleteResult> {
    const relationsToDelete = await this.find(query);
    const hubsAffected = [...new Set(relationsToDelete.map(relation => relation.hub.toString()))];

    const deletedIds = await this.applyQuery(query).delete();

    const hubsToDelete = await this.getHubsToDelete(hubsAffected);
    if (hubsToDelete.length) {
      await this.table.whereIn('hub', hubsToDelete).delete();
    }

    return { acknowledged: true, deletedCount: deletedIds.length };
  }

  async updateMany(query: RelationshipQuery, update: RelationshipUpdate): Promise<void> {
    const setClauses: string[] = [];
    const bindings: unknown[] = [];

    for (const [column, value] of Object.entries(update.set ?? {})) {
      setClauses.push(`"${column}" = ?`);
      bindings.push(value);
    }

    const renameEntries = Object.entries(update.rename ?? {});
    const unsetFields = update.unset ?? [];

    const removeKeys = [
      ...renameEntries.map(([old]) => old.replace(/^metadata\./, '')),
      ...unsetFields.map(field => field.replace(/^metadata\./, '')),
    ];

    if (removeKeys.length || renameEntries.length) {
      let metadataExpr = 'metadata';
      if (removeKeys.length) {
        metadataExpr = `(${metadataExpr} - ${removeKeys.map(() => '?').join(' - ')})`;
        bindings.push(...removeKeys);
      }
      if (renameEntries.length) {
        const buildPairs: string[] = [];
        renameEntries.forEach(([old, next]) => {
          buildPairs.push('?', 'metadata->?');
          bindings.push(next.replace(/^metadata\./, ''));
          bindings.push(old.replace(/^metadata\./, ''));
        });
        metadataExpr = `(${metadataExpr} || jsonb_build_object(${buildPairs.join(', ')}))`;
      }
      setClauses.push(`metadata = ${metadataExpr}`);
    }

    if (setClauses.length === 0) {
      return;
    }

    const where = this.buildWhere(query);
    const sql = `UPDATE connections SET ${setClauses.join(', ')} ${where.sql}`;
    await this.table.raw(sql, [...bindings, ...where.bindings]);
  }

  async getHubConnectionsForEntity(sharedId: string): Promise<HubConnection[]> {
    const rows = await this.rawRows<PostgresRelationshipRow>(
      `SELECT c.* FROM connections c
       WHERE c."hub" IN (SELECT "hub" FROM connections WHERE "entity" = ?)`,
      [sharedId]
    );
    return rows.map(PostgresRelationshipMapper.toHubConnection);
  }

  async getByEntitySharedIds(sharedIds: string[]): Promise<Relation[]> {
    if (sharedIds.length === 0) {
      return [];
    }

    const ownRelations = await this.find({ entity: sharedIds });
    const hubIds = [...new Set(ownRelations.map(relation => relation.hub.toString()))];
    if (hubIds.length === 0) {
      return [];
    }

    const dbRelationships = await this.find({ hub: hubIds });

    const _connectedDocuments = await this.entitiesDAO.find({
      sharedIds: dbRelationships.map(relation => relation.entity),
      language: await this.settingsDS.getDefaultLanguageKey(),
    });

    const connectedDocuments = _connectedDocuments.reduce(
      (res, doc) => {
        // @ts-ignore sharedId can not be null, this is a misstype on v1 types
        res[doc.sharedId] = doc;
        return res;
      },
      {} as Record<string, unknown>
    );

    return withConnectedData(dbRelationships, connectedDocuments) as Relation[];
  }

  async getByEntity(
    sharedId: string,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]> {
    const hubRelations = await this.getHubConnections([sharedId]);
    if (hubRelations.length === 0) {
      return [];
    }

    const connectedSharedIds = [...new Set(hubRelations.map(relation => relation.entity))];
    const _connectedDocuments = await this.entitiesDAO.find({
      sharedIds: connectedSharedIds,
      language,
    });

    const connectedDocuments = _connectedDocuments.reduce(
      (res, doc) => {
        // @ts-ignore sharedId can not be null, this is a misstype on v1 types
        res[doc.sharedId] = doc;
        return res;
      },
      {} as Record<string, unknown>
    );

    return processRelationshipCollection({
      relationshipArray: hubRelations,
      connectedDocuments,
      sharedId,
      unpublished: includeUnpublished,
      language,
    }) as Relation[];
  }

  async getEntityMetadataRelationships(
    entity: RelationshipSourceEntity,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]> {
    const referencedSharedIds = Array.from(
      entity.getReferencedRelationshipEntitySharedIds(language)
    );

    if (referencedSharedIds.length === 0) {
      return [];
    }

    const ownRelations = await this.find({ entity: entity.sharedId });
    const hubIds = [...new Set(ownRelations.map(relation => relation.hub.toString()))];
    if (hubIds.length === 0) {
      return [];
    }

    const relevantConnections = await this.find({
      entity: referencedSharedIds,
      hub: hubIds,
    });

    if (relevantConnections.length === 0) {
      return [];
    }

    const connectedSharedIds = [...new Set(relevantConnections.map(relation => relation.entity))];

    const _connectedDocuments = await this.entitiesDAO.find({
      sharedIds: connectedSharedIds,
      language,
    });

    const connectedDocuments = _connectedDocuments.reduce(
      (res, doc) => {
        // @ts-ignore sharedId can not be null, this is a misstype on v1 types
        res[doc.sharedId] = doc;
        return res;
      },
      {} as Record<string, unknown>
    );

    let relations = withConnectedData(relevantConnections, connectedDocuments);
    if (!includeUnpublished) {
      relations = relations.filter((r: any) => r.entityData?.published);
    }

    return relations as Relation[];
  }

  async deleteByFiles(fileIds: string[]): Promise<void> {
    await this.delete({ file: fileIds });
  }

  async bulkDeleteBySharedId(sharedIds: string[]): Promise<void> {
    await this.delete({ entity: sharedIds });
  }

  async getEntityReferencesByRelationshipTypes(
    sharedId: string,
    relationTypes: string[]
  ): Promise<Record<string, Record<string, EntityReferenceByRelationshipType>>> {
    if (relationTypes.length === 0) {
      return {};
    }

    const bindings: unknown[] = [sharedId];
    const relationTypeIds = relationTypes.map(id =>
      PostgresRelationshipsV1DataSource.toStringId(id)
    );
    const rows = await this.rawRows<{
      relation_type: string | null;
      entity_shared_id: string;
      hub: string;
      right_side_id: string;
      right_side_template: string | null;
      entity_template: string | null;
    }>(
      `SELECT
         right_side."template" AS relation_type,
         right_side."entity" AS entity_shared_id,
         r."hub" AS hub,
         right_side."_id" AS right_side_id,
         right_side."template" AS right_side_template,
         e."template" AS entity_template
       FROM connections r
       JOIN connections right_side ON right_side."hub" = r."hub"
       LEFT JOIN entities e ON e."sharedId" = right_side."entity"
       WHERE r."entity" = ?
         AND right_side."template" IN (${PostgresRelationshipsV1DataSource.placeholders(relationTypeIds.length)})`,
      [...bindings, ...relationTypeIds]
    );

    const byRightSide = new Map<
      string,
      {
        _id: string;
        hub: string;
        entity: string;
        template: string | null;
        entityData: { template: string }[];
      }
    >();

    rows.forEach(row => {
      const existing = byRightSide.get(row.right_side_id);
      const entityTemplate = row.entity_template ? { template: row.entity_template } : null;
      if (existing) {
        if (entityTemplate) existing.entityData.push(entityTemplate);
        return;
      }
      byRightSide.set(row.right_side_id, {
        _id: row.right_side_id,
        hub: row.hub,
        entity: row.entity_shared_id,
        template: row.right_side_template,
        entityData: entityTemplate ? [entityTemplate] : [],
      });
    });

    const result: Record<string, Record<string, EntityReferenceByRelationshipType>> = {};
    byRightSide.forEach(reference => {
      if (!reference.template) return;
      result[reference.template] ??= {};
      result[reference.template][reference.entity] = {
        hub: reference.hub,
        rightSide: {
          _id: reference._id,
          entity: reference.entity,
          template: reference.template,
          entityData: reference.entityData,
        },
      };
    });

    return result;
  }

  async guessRelationshipPropertyHub(
    sharedId: string,
    relationType: string
  ): Promise<RelationshipPropertyHubCandidate[]> {
    const rows = await this.rawRows<{ hub: string }>(
      `SELECT right_side."hub" AS hub
       FROM connections r
       JOIN connections right_side ON right_side."hub" = r."hub" AND right_side."entity" <> ?
       WHERE r."entity" = ?
       GROUP BY right_side."hub"
       HAVING COUNT(DISTINCT right_side."template") = 1
          AND MIN(right_side."template") = ?`,
      [sharedId, sharedId, PostgresRelationshipsV1DataSource.toStringId(relationType)]
    );

    return rows.map(row => ({
      _id: row.hub,
      templates: [PostgresRelationshipsV1DataSource.toStringId(relationType)],
    }));
  }

  async getRightSideConnections(
    entitySharedId: string,
    relationTypeFilter: (string | null)[]
  ): Promise<V1Relationship[]> {
    const bindings: unknown[] = [entitySharedId, entitySharedId];
    let sql = `SELECT c.* FROM connections c
       WHERE c."hub" IN (SELECT "hub" FROM connections WHERE "entity" = ?)
         AND c."entity" <> ?`;

    const nonNullTemplates = relationTypeFilter
      .filter(type => type !== null)
      .map(type => PostgresRelationshipsV1DataSource.toStringId(type));
    const hasNull = relationTypeFilter.includes(null);

    if (relationTypeFilter.length) {
      if (hasNull && nonNullTemplates.length) {
        sql += ` AND (c."template" IS NULL OR c."template" IN (${PostgresRelationshipsV1DataSource.placeholders(
          nonNullTemplates.length
        )}))`;
        bindings.push(...nonNullTemplates);
      } else if (hasNull) {
        sql += ` AND c."template" IS NULL`;
      } else if (nonNullTemplates.length) {
        sql += ` AND c."template" IN (${PostgresRelationshipsV1DataSource.placeholders(nonNullTemplates.length)})`;
        bindings.push(...nonNullTemplates);
      }
    }

    const rows = await this.rawRows<PostgresRelationshipRow>(sql, bindings);
    return rows.map(PostgresRelationshipMapper.toV1Relationship);
  }

  async getMatchingHubsCount(
    entitySharedId: string,
    searchResultIds: string[],
    filteredConnectionIds: string[]
  ): Promise<number> {
    const bindings: unknown[] = [entitySharedId];
    let inner: string;
    if (filteredConnectionIds.length) {
      inner = `c."_id" IN (${PostgresRelationshipsV1DataSource.placeholders(filteredConnectionIds.length)})`;
      bindings.push(
        ...filteredConnectionIds.map(id => PostgresRelationshipsV1DataSource.toStringId(id))
      );
    } else {
      inner = `c."entity" IN (${PostgresRelationshipsV1DataSource.placeholders(searchResultIds.length)})`;
      bindings.push(...searchResultIds);
    }

    const rows = await this.rawRows<{ total: number }>(
      `SELECT COUNT(DISTINCT r."hub")::int AS total
       FROM connections r
       WHERE r."entity" = ?
         AND EXISTS (
           SELECT 1 FROM connections c
           WHERE c."hub" = r."hub" AND ${inner}
         )`,
      bindings
    );

    return rows[0]?.total ?? 0;
  }

  async getHubsForSearch(
    entitySharedId: string,
    filteredConnectionIds: string[],
    filteredSharedIds: string[],
    limit: number
  ): Promise<SearchHub[]> {
    const bindings: unknown[] = [entitySharedId, entitySharedId];
    let connectionMatch: string;
    if (filteredConnectionIds.length) {
      connectionMatch = `c."_id" IN (${PostgresRelationshipsV1DataSource.placeholders(filteredConnectionIds.length)})`;
      bindings.push(
        ...filteredConnectionIds.map(id => PostgresRelationshipsV1DataSource.toStringId(id))
      );
    } else {
      connectionMatch = `c."entity" IN (${PostgresRelationshipsV1DataSource.placeholders(filteredSharedIds.length)})`;
      bindings.push(...filteredSharedIds);
    }

    const rows = await this.rawRows<PostgresRelationshipRow>(
      `SELECT c.* FROM connections c
       WHERE c."hub" IN (SELECT "hub" FROM connections WHERE "entity" = ?)
         AND (c."entity" = ? OR ${connectionMatch})`,
      bindings
    );

    const byHub = new Map<string, V1Relationship[]>();
    rows.forEach(row => {
      const relation = PostgresRelationshipMapper.toV1Relationship(row);
      const hub = relation.hub.toString();
      const existing = byHub.get(hub);
      if (existing) {
        existing.push(relation);
      } else {
        byHub.set(hub, [relation]);
      }
    });

    const hubs: { hub: string; connections: V1Relationship[]; sortValue: number }[] = [];
    byHub.forEach((connections, hub) => {
      if (!connections.some(connection => filteredSharedIds.includes(connection.entity))) {
        return;
      }

      let sortValue = 999999;
      connections.forEach(connection => {
        if (connection.entity !== entitySharedId) {
          sortValue = Math.min(sortValue, filteredSharedIds.indexOf(connection.entity));
        }
      });

      hubs.push({ hub, connections, sortValue });
    });

    hubs.sort((a, b) => a.sortValue - b.sortValue);
    return hubs.slice(0, limit).map(hub => ({ hub: hub.hub, connections: hub.connections }));
  }

  async getEntitiesAffectedByHubs(hubIds: string[]): Promise<string[]> {
    if (hubIds.length === 0) {
      return [];
    }
    const rows = await this.rawRows<{ entity: string | null }>(
      `SELECT DISTINCT "entity" FROM connections WHERE "hub" IN (${PostgresRelationshipsV1DataSource.placeholders(hubIds.length)})`,
      hubIds
    );
    return rows.map(row => row.entity).filter((entity): entity is string => !!entity);
  }

  async getHubsToDelete(hubIds: string[]): Promise<string[]> {
    if (hubIds.length === 0) {
      return [];
    }
    const rows = await this.rawRows<{ hub: string | null }>(
      `SELECT "hub" FROM connections WHERE "hub" IN (${PostgresRelationshipsV1DataSource.placeholders(hubIds.length)})
       GROUP BY "hub" HAVING COUNT(*) < 2`,
      hubIds
    );
    return rows.map(row => row.hub).filter((hub): hub is string => !!hub);
  }

  private applyQuery(query: RelationshipQuery): PostgresTable<PostgresRelationshipRow> {
    let table = this.table.query<PostgresRelationshipRow>();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'template' && value === null) {
        table = table.whereNull('template');
      } else if (Array.isArray(value)) {
        table = table.whereIn(
          key,
          (value as unknown[]).map(v => PostgresRelationshipsV1DataSource.toStringId(v)) as string[]
        );
      } else {
        table = table.where({ [key]: PostgresRelationshipsV1DataSource.toStringId(value) });
      }
    });
    return table;
  }

  private buildWhere(query: RelationshipQuery): { sql: string; bindings: unknown[] } {
    const clauses: string[] = [];
    const bindings: unknown[] = [];
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'template' && value === null) {
        clauses.push(`"template" IS NULL`);
      } else if (Array.isArray(value)) {
        clauses.push(
          `"${key}" IN (${PostgresRelationshipsV1DataSource.placeholders((value as unknown[]).length)})`
        );
        bindings.push(
          ...(value as unknown[]).map(v => PostgresRelationshipsV1DataSource.toStringId(v))
        );
      } else {
        clauses.push(`"${key}" = ?`);
        bindings.push(PostgresRelationshipsV1DataSource.toStringId(value));
      }
    });
    return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', bindings };
  }

  private static placeholders(count: number): string {
    return Array.from({ length: count }, () => '?').join(', ');
  }

  private static toStringId(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (value instanceof ObjectId) return value.toHexString();
    if (typeof value === 'object') {
      const nested = (value as { _id?: unknown })._id;
      if (nested !== undefined) return PostgresRelationshipsV1DataSource.toStringId(nested);
      return '';
    }
    return String(value);
  }

  private async rawRows<T = Record<string, unknown>>(
    sql: string,
    bindings: unknown[] = []
  ): Promise<T[]> {
    const result = await this.table.raw<{ rows: T[] }>(sql, bindings);
    return result.rows ?? [];
  }
}

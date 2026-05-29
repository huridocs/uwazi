/* eslint-disable max-lines */
import { Db } from 'mongodb';
import pg from 'pg';
import { EntityNotFoundError } from '#api/core/application/errors.js';
import { BreakLoopSignal, ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import {
  EntityRow,
  PostgresEntityMapper,
} from '#api/core/infrastructure/postgresql/entity/PostgresEntityMapper.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { Entity } from '../../core/domain/entity/Entity.js';
import { MultiLanguageEntityDataSource } from '../contracts/MultiLanguageEntitiesDataSource.js';
import { Property } from '../../core/domain/template/Property.js';
import { V1RelationshipProperty } from '../../core/domain/template/V1RelationshipProperty.js';

// ---------------------------------------------------------------------------
// Simple in-memory ResultSet backed by an array
// ---------------------------------------------------------------------------

class ArrayResultSet<T> implements ResultSet<T> {
  private items: T[];

  private cursor = 0;

  constructor(items: T[]) {
    this.items = items;
  }

  async all(): Promise<T[]> {
    return this.items;
  }

  async page(number: number, size: number): Promise<T[]> {
    return this.items.slice((number - 1) * size, number * size);
  }

  async first(): Promise<T | null> {
    return this.items[0] ?? null;
  }

  async hasNext(): Promise<boolean> {
    return this.cursor < this.items.length;
  }

  async nextBatch(size: number): Promise<T[]> {
    const batch = this.items.slice(this.cursor, this.cursor + size);
    this.cursor += batch.length;
    return batch;
  }

  async forEach(callback: (item: T) => BreakLoopSignal): Promise<void> {
    for (const item of this.items) {
      // eslint-disable-next-line no-await-in-loop
      const signal = await callback(item);
      if (signal === false) break;
    }
  }

  async forEachBatch(batchSize: number, callback: (items: T[]) => BreakLoopSignal): Promise<void> {
    for (let i = 0; i < this.items.length; i += batchSize) {
      const batch = this.items.slice(i, i + batchSize);
      // eslint-disable-next-line no-await-in-loop
      const signal = await callback(batch);
      if (signal === false) break;
    }
  }

  async find(predicate: (item: T) => Promise<boolean> | boolean): Promise<T | null> {
    for (const item of this.items) {
      // eslint-disable-next-line no-await-in-loop
      if (await predicate(item)) return item;
    }
    return null;
  }

  async every(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean> {
    if (this.items.length === 0) return true;
    for (const item of this.items) {
      // eslint-disable-next-line no-await-in-loop
      if (!(await predicate(item))) return false;
    }
    return true;
  }

  async some(predicate: (item: T) => Promise<boolean> | boolean): Promise<boolean> {
    for (const item of this.items) {
      // eslint-disable-next-line no-await-in-loop
      if (await predicate(item)) return true;
    }
    return false;
  }

  async indexed(
    getKey: (item: T) => string | number
  ): Promise<Record<string | number, Awaited<T>>> {
    const result: Record<string | number, Awaited<T>> = {};
    for (const item of this.items) {
      result[getKey(item)] = item as Awaited<T>;
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// PostgresEntityDataSource
// ---------------------------------------------------------------------------

type Deps = {
  pool: pg.Pool;
  transactionManager: MongoTransactionManager;
  templatesDS: TemplatesDataSource;
  mongoDb: Db;
};

export class PostgresEntityDataSource
  extends PostgresDataSource
  implements MultiLanguageEntityDataSource
{
  private templatesDS: TemplatesDataSource;

  constructor(deps: Deps) {
    super({
      pool: deps.pool,
      transactionManager: deps.transactionManager,
      mongoDb: deps.mongoDb,
      syncNamespace: 'entities',
    });
    this.templatesDS = deps.templatesDS;
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  private async getEntitiesByQuery(sql: string, params: unknown[]): Promise<ResultSet<Entity>> {
    const result = await this.query<EntityRow>(sql, params);
    const rows = result.rows;

    if (rows.length === 0) return new ArrayResultSet([]);

    const bySharedId = new Map<string, EntityRow[]>();
    for (const row of rows) {
      const list = bySharedId.get(row.sharedId) ?? [];
      list.push(row);
      bySharedId.set(row.sharedId, list);
    }

    const entities: Entity[] = [];
    for (const [, translationRows] of bySharedId) {
      const templateId = translationRows[0].templateId;
      // eslint-disable-next-line no-await-in-loop
      const templateResult = await this.templatesDS.getById(templateId);
      if (templateResult.isError()) continue;
      entities.push(PostgresEntityMapper.toDomain(translationRows, templateResult.getData()));
    }

    return new ArrayResultSet(entities);
  }

  async getById(id: string): Promise<ResultType<Entity, EntityNotFoundError>> {
    const resultSet = await this.getEntitiesByQuery(
      `SELECT * FROM entities WHERE "sharedId" = $1`,
      [id]
    );
    const [entity] = await resultSet.all();
    if (!entity) return Result.fail(new EntityNotFoundError(id));
    return Result.ok(entity);
  }

  async getAllBySharedId(sharedIds: string[]): Promise<ResultType<Entity[], Error>> {
    const resultSet = await this.getEntitiesByQuery(
      `SELECT * FROM entities WHERE "sharedId" = ANY($1)`,
      [sharedIds]
    );
    const entities = await resultSet.all();
    if (!entities.length) {
      return Result.fail(new Error(`Entities with sharedIds ${sharedIds.join(', ')} not found`));
    }
    return Result.ok(entities);
  }

  async getEntitiesByTemplateId(templateId: string): Promise<ResultSet<Entity>> {
    return this.getEntitiesByQuery(`SELECT * FROM entities WHERE "templateId" = $1`, [templateId]);
  }

  async getEntitiesBySharedIds(sharedIds: string[]): Promise<ResultSet<Entity>> {
    return this.getEntitiesByQuery(`SELECT * FROM entities WHERE "sharedId" = ANY($1)`, [
      sharedIds,
    ]);
  }

  async getSharedIdsByTemplateId(templateId: string): Promise<ResultSet<string>> {
    const result = await this.query<{ sharedId: string }>(
      `SELECT DISTINCT "sharedId" FROM entities WHERE "templateId" = $1`,
      [templateId]
    );
    return new ArrayResultSet(result.rows.map(r => r.sharedId));
  }

  async countByTemplateId(templateId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(DISTINCT "sharedId") AS count FROM entities WHERE "templateId" = $1`,
      [templateId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async getSharedIdsByTemplateAndTitles(
    templateId: string,
    titles: string[]
  ): Promise<Array<{ title: string; sharedId: string }>> {
    if (!titles.length) return [];
    const result = await this.query<{ title: string; sharedId: string }>(
      `SELECT DISTINCT title, "sharedId" FROM entities
       WHERE "templateId" = $1 AND title = ANY($2)`,
      [templateId, titles]
    );
    return result.rows;
  }

  async getSharedIdsByTitles(
    titles: string[]
  ): Promise<Array<{ title: string; sharedId: string; templateId: string }>> {
    if (!titles.length) return [];
    const result = await this.query<{ title: string; sharedId: string; templateId: string }>(
      `SELECT DISTINCT title, "sharedId", "templateId" FROM entities WHERE title = ANY($1)`,
      [titles]
    );
    return result.rows;
  }

  async getSharedIdsUsingThesaurus(thesaurusId: string): Promise<string[]> {
    // Find templates that directly reference the thesaurus
    const allTemplates = await this.templatesDS.getAll().all();

    const directTemplateIds = allTemplates
      .filter((t: any) => t.properties.some((p: any) => p.content === thesaurusId))
      .map((t: any) => t.id);

    // Find relationship templates pointing at those templates
    const relatedTemplateIds = allTemplates
      .filter((t: any) =>
        t.properties.some(
          (p: any) => p.type === 'relationship' && directTemplateIds.includes(p.content)
        )
      )
      .map((t: any) => t.id);

    const allTemplateIds = [...new Set([...directTemplateIds, ...relatedTemplateIds])];

    if (!allTemplateIds.length) return [];

    const result = await this.query<{ sharedId: string }>(
      `SELECT DISTINCT "sharedId"
       FROM entities
       WHERE "templateId" = ANY($1)
         AND metadata != '{}'::jsonb`,
      [allTemplateIds]
    );
    return result.rows.map(r => r.sharedId);
  }

  async getEntitiesByRelatedProperties(
    entities: Entity[],
    properties: V1RelationshipProperty[]
  ): Promise<ResultSet<Entity>> {
    const relatedSharedIds = entities
      .map(e => properties.map(prop => e.getValue(prop.name, e.languages[0]).value).flat())
      .flat()
      .map((metadataValue: any) => metadataValue.value)
      .filter((v: any): v is string => typeof v === 'string');

    return this.getEntitiesBySharedIds(relatedSharedIds);
  }

  // ---------------------------------------------------------------------------
  // Writes (buffered — execute after Mongo commits)
  // ---------------------------------------------------------------------------

  private bufferUpsertRow(row: EntityRow): void {
    this.bufferWrite(
      `INSERT INTO entities (
        "_id", "sharedId", "language", "templateId", "title",
        "published", "creationDate", "editDate", "userId",
        "mongoLanguage", "generatedToc", "preview", "__v",
        "icon", "metadata", "obsoleteMetadata", "permissions"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT ("_id") DO UPDATE SET
        "sharedId"         = EXCLUDED."sharedId",
        "language"         = EXCLUDED."language",
        "templateId"       = EXCLUDED."templateId",
        "title"            = EXCLUDED."title",
        "published"        = EXCLUDED."published",
        "creationDate"     = EXCLUDED."creationDate",
        "editDate"         = EXCLUDED."editDate",
        "userId"           = EXCLUDED."userId",
        "mongoLanguage"    = EXCLUDED."mongoLanguage",
        "generatedToc"     = EXCLUDED."generatedToc",
        "preview"          = EXCLUDED."preview",
        "__v"              = EXCLUDED."__v",
        "icon"             = EXCLUDED."icon",
        "metadata"         = EXCLUDED."metadata",
        "obsoleteMetadata" = EXCLUDED."obsoleteMetadata",
        "permissions"      = EXCLUDED."permissions"`,
      [
        row._id,
        row.sharedId,
        row.language,
        row.templateId,
        row.title,
        row.published,
        row.creationDate,
        row.editDate,
        row.userId ?? null,
        row.mongoLanguage ?? null,
        row.generatedToc ?? null,
        row.preview ?? null,
        row.__v ?? null,
        row.icon ? JSON.stringify(row.icon) : null,
        JSON.stringify(row.metadata),
        JSON.stringify(row.obsoleteMetadata),
        JSON.stringify(row.permissions),
      ]
    );
  }

  /** Upsert that preserves existing published/permissions (for bulkUpdate content-only path). */
  private bufferContentOnlyUpsertRow(row: EntityRow): void {
    this.bufferWrite(
      `INSERT INTO entities (
        "_id", "sharedId", "language", "templateId", "title",
        "published", "creationDate", "editDate", "userId",
        "mongoLanguage", "generatedToc", "preview", "__v",
        "icon", "metadata", "obsoleteMetadata", "permissions"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT ("_id") DO UPDATE SET
        "sharedId"         = EXCLUDED."sharedId",
        "language"         = EXCLUDED."language",
        "templateId"       = EXCLUDED."templateId",
        "title"            = EXCLUDED."title",
        "creationDate"     = EXCLUDED."creationDate",
        "editDate"         = EXCLUDED."editDate",
        "userId"           = EXCLUDED."userId",
        "mongoLanguage"    = EXCLUDED."mongoLanguage",
        "generatedToc"     = EXCLUDED."generatedToc",
        "preview"          = EXCLUDED."preview",
        "__v"              = EXCLUDED."__v",
        "icon"             = EXCLUDED."icon",
        "metadata"         = EXCLUDED."metadata",
        "obsoleteMetadata" = EXCLUDED."obsoleteMetadata"`,
      [
        row._id,
        row.sharedId,
        row.language,
        row.templateId,
        row.title,
        row.published,
        row.creationDate,
        row.editDate,
        row.userId ?? null,
        row.mongoLanguage ?? null,
        row.generatedToc ?? null,
        row.preview ?? null,
        row.__v ?? null,
        row.icon ? JSON.stringify(row.icon) : null,
        JSON.stringify(row.metadata),
        JSON.stringify(row.obsoleteMetadata),
        JSON.stringify(row.permissions),
      ]
    );
  }

  async create(entity: Entity): Promise<void> {
    const rows = PostgresEntityMapper.toDBO(entity);
    rows.forEach(row => this.bufferUpsertRow(row));
  }

  async bulkInsert(entities: Entity[]): Promise<void> {
    if (entities.length === 0) return;
    const allRows = entities.flatMap(e => PostgresEntityMapper.toDBO(e));
    allRows.forEach(row => this.bufferUpsertRow(row));
  }

  async update(entity: Entity): Promise<void> {
    const rows = PostgresEntityMapper.toDBO(entity);
    rows.forEach(row => {
      if (row.preview === null) {
        this.bufferWrite(`UPDATE entities SET "preview" = NULL WHERE "_id" = $1`, [row._id]);
      }
      this.bufferUpsertRow(row);
    });
  }

  async bulkUpdate(entities: Entity[]): Promise<void> {
    const allRows = entities.flatMap(e => PostgresEntityMapper.toDBO(e));
    allRows.forEach(row => {
      if (row.preview === null) {
        this.bufferWrite(`UPDATE entities SET "preview" = NULL WHERE "_id" = $1`, [row._id]);
      }
      this.bufferContentOnlyUpsertRow(row);
    });
  }

  async bulkUpdateDeprecated(entitiesToSave: Entity[], properties: Property[] = []): Promise<void> {
    for (const entity of entitiesToSave) {
      for (const [language, translation] of entity.translationsList) {
        const metadataUpdates: Record<string, any> = {};
        for (const property of properties) {
          const { value } = translation.getValue(property.name);
          if (value) {
            metadataUpdates[property.name] = value;
          }
        }
        if (Object.keys(metadataUpdates).length > 0) {
          this.bufferWrite(
            `UPDATE entities
             SET "metadata" = "metadata" || $1::jsonb
             WHERE "sharedId" = $2 AND "language" = $3`,
            [JSON.stringify(metadataUpdates), entity.sharedId, language]
          );
        }
      }
    }
  }

  async touchEntitiesBySharedIds(sharedIds: string[]): Promise<void> {
    this.bufferWrite(`UPDATE entities SET "editDate" = $1 WHERE "sharedId" = ANY($2)`, [
      Date.now(),
      sharedIds,
    ]);
  }

  async deleteMetadataProperties(propertyNames: string[], sharedIds: string[]): Promise<void> {
    for (const name of propertyNames) {
      this.bufferWrite(
        `UPDATE entities SET "metadata" = "metadata" - $1 WHERE "sharedId" = ANY($2)`,
        [name, sharedIds]
      );
    }
  }

  async renameMetadataProperties(
    propertyNames: { [oldName: string]: string },
    sharedIds: string[]
  ): Promise<void> {
    for (const [oldName, newName] of Object.entries(propertyNames)) {
      this.bufferWrite(
        `UPDATE entities
         SET "metadata" = ("metadata" - $1) || jsonb_build_object($2::text, "metadata"->$1)
             WHERE "sharedId" = ANY($3) AND "metadata" ? $1`,
        [oldName, newName, sharedIds]
      );
    }
  }

  async deleteReferencesToSharedIds(deletedSharedIds: string[]): Promise<void> {
    if (deletedSharedIds.length === 0) return;

    // Get reference property names from templates
    const allTemplates = await this.templatesDS.getAll().all();
    const propertyNames = [
      ...new Set(
        allTemplates.flatMap((t: any) =>
          t.properties
            .filter((p: any) => ['select', 'multiselect', 'relationship'].includes(p.type))
            .map((p: any) => p.name)
        )
      ),
    ] as string[];

    if (propertyNames.length === 0) return;

    // For each reference property, remove deleted values from the JSONB array
    for (const propName of propertyNames) {
      this.bufferWrite(
        `UPDATE entities
         SET "metadata" = jsonb_set(
           "metadata",
           ARRAY[$1],
           COALESCE(
             (
               SELECT jsonb_agg(elem)
               FROM jsonb_array_elements("metadata"->$1) AS elem
               WHERE NOT (elem->>'value' = ANY($2))
             ),
             '[]'::jsonb
           )
         )
         WHERE "metadata" ? $1
           AND EXISTS (
             SELECT 1 FROM jsonb_array_elements("metadata"->$1) AS elem
             WHERE elem->>'value' = ANY($2)
           )`,
        [propName, deletedSharedIds]
      );
    }
  }

  async bulkDelete(sharedIds: string[]): Promise<void> {
    this.bufferWrite(`DELETE FROM entities WHERE "sharedId" = ANY($1)`, [sharedIds]);
  }
}

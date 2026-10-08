/* eslint-disable max-lines */
import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresResultSet } from '#api/core/infrastructure/postgresql/common/PostgresResultSet.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PostgresEntityMapper } from '#api/core/infrastructure/postgresql/entity/PostgresEntityMapper.js';
import { EntityRow } from '#api/core/infrastructure/postgresql/entity/PostgresEntityRow.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';

import {
  GetEntityParagraphRelationshipsInput,
  GetEntityParagraphRelationshipsOutput,
  GetExtractedParagraphsInput,
  GetExtractedParagraphsOutput,
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  GetExtractorsOutput,
  PXExtractorsQueryService,
} from '../../domain/PXExtractorsQueryService.js';
import { EntityStatus } from '../../domain/PXEntityStatusModel.js';
import { PXEntityStatusMapper } from '../PXEntityStatusMapper.js';
import { PXExtractorRow } from './PXExtractorRow.js';

const PRIVILEGED = { bypass: true, refIds: [] as string[] };

const getDefaultPagination = (inputNumber?: number, inputSize?: number) => {
  const number = inputNumber || 1;
  const size = inputSize || 10;
  const skip = (number - 1) * size;
  return { number, size, skip };
};

type Deps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
};

type StatusCountsRow = {
  _id: string;
  sourceTemplateId: string;
  targetTemplateId: string;
  paragraphNumberPropertyId: string;
  paragraphPropertyId: string;
  new_count: string;
  processing_count: string;
  obsolete_count: string;
  error_count: string;
  processed_count: string;
  total_count: string;
};

type ExtractorStatusRow = {
  entity_id: string;
  entity_shared_id: string;
  entity_title: string;
  entity_language: string;
  status_id: string;
  status: EntityStatus;
};

type RelationshipRow = {
  id: string;
  entitySharedId: string;
  hubId: string;
  relationshipTypeId: string;
};

export class PostgresPXExtractorsQueryService
  extends PostgresDataSource<PXExtractorRow>
  implements PXExtractorsQueryService
{
  constructor(deps: Deps) {
    super('px_extractors', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  getExtractors(): ResultSet<GetExtractorsOutput> {
    const sql = `
      SELECT
        e."_id",
        e."sourceTemplateId",
        e."targetTemplateId",
        e."paragraphNumberPropertyId",
        e."paragraphPropertyId",
        COUNT(*) FILTER (WHERE s."status" = 'new') AS new_count,
        COUNT(*) FILTER (WHERE s."status" IN ('processing', 'processing_obsolete')) AS processing_count,
        COUNT(*) FILTER (WHERE s."status" = 'obsolete') AS obsolete_count,
        COUNT(*) FILTER (WHERE s."status" = 'error') AS error_count,
        COUNT(*) FILTER (WHERE s."status" = 'processed') AS processed_count,
        COUNT(s."status") AS total_count
      FROM px_extractors e
      LEFT JOIN px_entities_status s ON s."extractorId" = e."_id"
      GROUP BY
        e."_id",
        e."sourceTemplateId",
        e."targetTemplateId",
        e."paragraphNumberPropertyId",
        e."paragraphPropertyId"
    `;

    return new PostgresResultSet(this.rawStream<StatusCountsRow>(sql), row => {
      const output = {
        _id: row._id,
        sourceTemplateId: row.sourceTemplateId,
        targetTemplateId: row.targetTemplateId,
        paragraphNumberPropertyId: row.paragraphNumberPropertyId,
        paragraphPropertyId: row.paragraphPropertyId,
        statusCount: {
          new: Number(row.new_count),
          processing: Number(row.processing_count),
          obsolete: Number(row.obsolete_count),
          error: Number(row.error_count),
          processed: Number(row.processed_count),
          total: Number(row.total_count),
        },
      };
      return output as GetExtractorsOutput;
    });
  }

  getExtractorStatuses(input: GetExtractorStatusesInput): ResultSet<GetExtractorStatusesOutput> {
    const { number, size, skip } = getDefaultPagination(input.page?.number, input.page?.size);
    const statuses = PostgresPXExtractorsQueryService.statusFilter(input);

    return new PostgresResultSet(
      this.streamExtractorStatuses(input, statuses, { number, size, skip }),
      item => item
    );
  }

  private async *streamExtractorStatuses(
    input: GetExtractorStatusesInput,
    statuses: EntityStatus[],
    { number, size, skip }: { number: number; size: number; skip: number }
  ): AsyncGenerator<GetExtractorStatusesOutput> {
    const totalRows = await this.countExtractorStatuses(input, statuses);
    const rows = await this.fetchExtractorStatuses(input, statuses, { skip, size });

    yield {
      rows,
      page: { number, size },
      totalRows,
    };
  }

  private async countExtractorStatuses(
    input: GetExtractorStatusesInput,
    statuses: EntityStatus[]
  ): Promise<number> {
    const { sql, bindings } = PostgresPXExtractorsQueryService.buildExtractorStatusesQuery(
      input,
      statuses
    );
    const rows = await this.rawRows<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM (${sql}) counted`,
      bindings
    );
    return Number(rows[0]?.total ?? 0);
  }

  private async fetchExtractorStatuses(
    input: GetExtractorStatusesInput,
    statuses: EntityStatus[],
    { skip, size }: { skip: number; size: number }
  ): Promise<GetExtractorStatusesOutput['rows']> {
    const { sql, bindings } = PostgresPXExtractorsQueryService.buildExtractorStatusesQuery(
      input,
      statuses
    );
    const rows = await this.rawRows<ExtractorStatusRow>(
      `${sql} ORDER BY e."title" ASC LIMIT ? OFFSET ?`,
      [...bindings, size, skip]
    );

    return rows.map(row => ({
      entity: {
        _id: row.entity_id,
        sharedId: row.entity_shared_id,
        title: row.entity_title,
        language: row.entity_language,
      },
      status: {
        _id: row.status_id,
        status: PXEntityStatusMapper.toDTO(row.status),
      },
    })) as GetExtractorStatusesOutput['rows'];
  }

  private static buildExtractorStatusesQuery(
    input: GetExtractorStatusesInput,
    statuses: EntityStatus[]
  ): { sql: string; bindings: unknown[] } {
    const bindings: unknown[] = [input.language, input.id];

    let statusClause = '';
    if (statuses.length > 0) {
      statusClause = ` AND s."status" IN (${PostgresPXExtractorsQueryService.placeholders(statuses.length)})`;
      bindings.push(...statuses);
    }

    const sql = `
      SELECT
        e."_id" AS entity_id,
        e."sharedId" AS entity_shared_id,
        e."title" AS entity_title,
        e."language" AS entity_language,
        s."_id" AS status_id,
        s."status" AS status
      FROM px_extractors x
      JOIN px_entities_status s ON s."extractorId" = x."_id"
      JOIN entities e ON e."sharedId" = s."entitySharedId" AND e."language" = ?
      WHERE x."_id" = ?${statusClause}
    `;

    return { sql, bindings };
  }

  private static statusFilter(input: GetExtractorStatusesInput): EntityStatus[] {
    const statuses = [...(input.filter?.status ?? [])];
    if (statuses.includes(EntityStatus.Processing)) {
      statuses.push(EntityStatus.ProcessingObsolete);
    }
    return statuses;
  }

  getEntityParagraphRelationships(
    input: GetEntityParagraphRelationshipsInput
  ): ResultSet<GetEntityParagraphRelationshipsOutput> {
    const requireEntityStatus = input.options?.requireEntityStatus ?? true;

    const bindings: unknown[] = [input.id, input.extractorId];
    let statusClause = '';
    if (requireEntityStatus) {
      statusClause = ` AND EXISTS (
        SELECT 1 FROM px_entities_status s
        WHERE s."extractorId" = x."_id" AND s."entitySharedId" = ?
      )`;
      bindings.push(input.id);
    }

    const sql = `
      SELECT
        c_target."_id" AS id,
        c_target."entity" AS "entitySharedId",
        c_target."hub" AS "hubId",
        c_target."template" AS "relationshipTypeId"
      FROM px_extractors x
      JOIN connections c_source
        ON c_source."entity" = ? AND c_source."template" = x."sourceRelationshipTypeId"
      JOIN connections c_target
        ON c_target."hub" = c_source."hub" AND c_target."template" = x."targetRelationshipTypeId"
      WHERE x."_id" = ?
        AND EXISTS (
          SELECT 1 FROM entities e
          WHERE e."sharedId" = c_target."entity" AND e."template" = x."targetTemplateId"
        )${statusClause}
    `;

    return new PostgresResultSet(this.rawStream<RelationshipRow>(sql, bindings), row => ({
      id: row.id,
      entitySharedId: row.entitySharedId,
      hubId: row.hubId,
      relationshipTypeId: row.relationshipTypeId,
    }));
  }

  getExtractedParagraphs(
    input: GetExtractedParagraphsInput
  ): ResultSet<GetExtractedParagraphsOutput> {
    const { number, size, skip } = getDefaultPagination(input.page?.number, input.page?.size);

    return new PostgresResultSet(
      this.streamExtractedParagraphs(input, { number, size, skip }),
      item => item
    );
  }

  private async *streamExtractedParagraphs(
    input: GetExtractedParagraphsInput,
    { number, size, skip }: { number: number; size: number; skip: number }
  ): AsyncGenerator<GetExtractedParagraphsOutput> {
    const totalRows = await this.countParagraphGroups(input.ids);
    const rows = await this.fetchParagraphRows(input, skip, size);

    yield {
      rows,
      page: { number, size },
      totalRows,
    };
  }

  private async countParagraphGroups(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const placeholders = PostgresPXExtractorsQueryService.placeholders(ids.length);
    const rows = await this.rawRows<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM (
        SELECT "sharedId" FROM entities WHERE "sharedId" IN (${placeholders}) GROUP BY "sharedId"
      ) grouped`,
      ids
    );
    return Number(rows[0]?.total ?? 0);
  }

  private async fetchParagraphRows(
    input: GetExtractedParagraphsInput,
    skip: number,
    size: number
  ): Promise<GetExtractedParagraphsOutput['rows']> {
    if (input.ids.length === 0) return [];

    const placeholders = PostgresPXExtractorsQueryService.placeholders(input.ids.length);
    const bindings: unknown[] = [
      input.paragraphNumberProperty,
      ...input.ids,
      skip,
      skip + size,
      input.mainLanguage,
    ];

    const sql = `
      WITH ranked AS (
        SELECT
          "sharedId",
          MIN(CAST(("metadata" -> ? -> 0 ->> 'value') AS numeric)) AS sort_value
        FROM entities
        WHERE "sharedId" IN (${placeholders})
        GROUP BY "sharedId"
      ),
      ordered AS (
        SELECT
          "sharedId",
          sort_value,
          ROW_NUMBER() OVER (ORDER BY sort_value ASC) AS rn
        FROM ranked
      )
      SELECT
        e."_id",
        e."sharedId",
        e."language",
        e."title",
        e."template",
        e."published",
        e."generatedToc",
        e."icon",
        e."creationDate",
        e."editDate",
        e."metadata",
        e."user",
        e."permissions",
        e."preview"
      FROM ordered o
      JOIN entities e ON e."sharedId" = o."sharedId"
      WHERE o.rn > ? AND o.rn <= ?
      ORDER BY o.sort_value ASC, (e."language" = ?) DESC, e."language"
    `;

    const rows = await this.rawRows<EntityRow>(sql, bindings);

    const grouped: GetExtractedParagraphsOutput['rows'] = [];
    const bySharedId = new Map<string, EntityDBO[]>();
    rows.forEach(row => {
      const entity = PostgresEntityMapper.toEntityDBO(row);
      const existing = bySharedId.get(row.sharedId);
      if (existing) {
        existing.push(entity);
      } else {
        const entities = [entity];
        bySharedId.set(row.sharedId, entities);
        grouped.push({ sharedId: row.sharedId, entities });
      }
    });

    return grouped;
  }

  private async rawRows<T = Record<string, unknown>>(
    sql: string,
    bindings: unknown[] = []
  ): Promise<T[]> {
    const result = (await this.table.transactionManager.withConnection(
      async trx => trx.raw(sql, bindings as any),
      PRIVILEGED
    )) as { rows: T[] };
    return result.rows ?? [];
  }

  private async *rawStream<T>(sql: string, bindings: unknown[] = []): AsyncGenerator<T> {
    const rows = await this.rawRows<T>(sql, bindings);
    for (const row of rows) yield row;
  }

  private static placeholders(count: number): string {
    return Array.from({ length: count }, () => '?').join(', ');
  }
}

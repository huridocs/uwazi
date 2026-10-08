import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { PXEntityStatusesQueryService } from '../../domain/PXEntityStatusesQueryService.js';

const PRIVILEGED = { bypass: true, refIds: [] as string[] };

type Deps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
};

type Params = {
  sourceTemplateId: string;
  extractorId: string;
  defaultLanguageKey: string;
  installedLanguages: LanguagesListSchema;
  batchSize: number;
};

export class PostgresPXEntityStatusesQueryService
  extends PostgresDataSource<Record<string, unknown>>
  implements PXEntityStatusesQueryService
{
  constructor(deps: Deps) {
    super('entities', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
  }

  async fetchUnprocessedEntities(params: Params): Promise<{ sharedId: string }[]> {
    const installedLanguageCodes = params.installedLanguages.map(language => language.ISO639_3);

    if (installedLanguageCodes.length === 0) {
      return [];
    }

    const placeholders = Array.from({ length: installedLanguageCodes.length }, () => '?').join(
      ', '
    );

    const sql = `
      SELECT e."sharedId"
      FROM entities e
      WHERE e."template" = ?
        AND e."language" = ?
        AND EXISTS (
          SELECT 1 FROM files f
          WHERE f."entity" = e."sharedId" AND f."language" IN (${placeholders})
        )
        AND NOT EXISTS (
          SELECT 1 FROM px_entities_status s
          WHERE s."entitySharedId" = e."sharedId" AND s."extractorId" = ?
        )
      LIMIT ?
    `;

    const bindings: unknown[] = [
      params.sourceTemplateId,
      params.defaultLanguageKey,
      ...installedLanguageCodes,
      params.extractorId,
      params.batchSize,
    ];

    const result = (await this.table.transactionManager.withConnection(
      async trx => trx.raw(sql, bindings as any),
      PRIVILEGED
    )) as { rows: { sharedId: string }[] };

    return result.rows ?? [];
  }
}

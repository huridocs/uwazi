import { Db } from 'mongodb';
import { Result } from '#api/core/libs/Result.js';
import { PagesDataSource } from '#api/pages.v2/application/contracts/PagesDataSource.js';
import { Page } from '#api/pages.v2/domain/Page.js';
import { PageNotFoundError } from '#api/pages.v2/domain/errors.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { PageLocaleRow, PageRow, PostgresPageMapper } from './PostgresPageMapper.js';

const LOCALES_TABLE = 'page_locales';

export class PostgresPagesDataSource
  extends PostgresDataSource<PageRow>
  implements PagesDataSource
{
  /**
   * Locale rows have no `_id` column (their key is page_id + language), so this
   * table is only used for reads and inserts — `delete`/`upsert` return `_id`.
   */
  private readonly locales: PostgresTable<PageLocaleRow>;

  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('pages', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'pages' },
    });
    this.locales = PostgresTable.for<PageLocaleRow>({
      tableName: LOCALES_TABLE,
      tenantId: deps.tenantId,
      transactionManager: deps.pgTransactionManager,
    });
  }

  private async loadLocales(pageIds: string[]): Promise<Record<string, PageLocaleRow[]>> {
    if (!pageIds.length) {
      return {};
    }
    const rows = await this.locales.whereIn('page_id', pageIds).all();
    return rows.reduce<Record<string, PageLocaleRow[]>>((byPage, row) => {
      byPage[row.page_id] = (byPage[row.page_id] ?? []).concat(row);
      return byPage;
    }, {});
  }

  private async deleteLocales(pageId: string): Promise<void> {
    await this.locales.raw(`DELETE FROM ${LOCALES_TABLE} WHERE "page_id" = ?`, [pageId]);
  }

  private async replaceLocales(page: Page): Promise<void> {
    await this.deleteLocales(page.id);
    const rows = PostgresPageMapper.toLocaleRows(page);
    if (rows.length) {
      await this.locales.insert(rows);
    }
  }

  async getBySharedId(sharedId: string) {
    const row = await this.table.where({ shared_id: sharedId }).first();
    if (!row) {
      return Result.fail(new PageNotFoundError(sharedId));
    }

    const localeRows = (await this.loadLocales([row._id]))[row._id] ?? [];
    if (!localeRows.length) {
      return Result.fail(new PageNotFoundError(sharedId));
    }

    return Result.ok(PostgresPageMapper.toDomain(row, localeRows));
  }

  async getAll(): Promise<Page[]> {
    const rows = await this.table.all();
    const localesByPage = await this.loadLocales(rows.map(row => row._id));

    return rows
      .filter(row => localesByPage[row._id]?.length)
      .map(row => PostgresPageMapper.toDomain(row, localesByPage[row._id]));
  }

  async create(page: Page): Promise<void> {
    await this.table.insert(PostgresPageMapper.toRow(page));
    await this.replaceLocales(page);
  }

  async update(page: Page): Promise<void> {
    await this.table.upsert(PostgresPageMapper.toRow(page), {
      merge: ['shared_id', 'creation_date', 'entity_view', 'markdown_support'],
    });
    await this.replaceLocales(page);
  }

  async deleteBySharedId(sharedId: string): Promise<void> {
    const row = await this.table.where({ shared_id: sharedId }).first();
    if (!row) {
      return;
    }
    await this.deleteLocales(row._id);
    await this.table.where({ shared_id: sharedId }).delete();
  }

  async countPagesMissingLocale(language: string): Promise<number> {
    return this.table
      .whereRaw(`EXISTS (SELECT 1 FROM ${LOCALES_TABLE} l WHERE l."page_id" = pages."_id")`)
      .whereRaw(
        `NOT EXISTS (SELECT 1 FROM ${LOCALES_TABLE} l WHERE l."page_id" = pages."_id" AND l."language" = ?)`,
        [language]
      )
      .count();
  }
}

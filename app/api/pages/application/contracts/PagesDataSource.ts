import { Page } from '#api/pages/domain/Page.js';
import { PageNotFoundError } from '#api/pages/domain/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

export interface PagesDataSource {
  getBySharedId(sharedId: string): Promise<ResultType<Page, PageNotFoundError>>;
  getBySlug(slug: string): Promise<ResultType<Page, PageNotFoundError>>;
  existsWithSlug(slug: string, excludeSharedId?: string): Promise<boolean>;
  getAll(): Promise<Page[]>;
  create(page: Page): Promise<void>;
  update(page: Page): Promise<void>;
  deleteBySharedId(sharedId: string): Promise<void>;
  existsWithLocale(language: string): Promise<boolean>;
}

import { ResultType } from '#api/core/libs/Result.js';
import { Page } from '#api/pages.v2/domain/Page.js';
import { PageNotFoundError } from '#api/pages.v2/domain/errors.js';

export interface PagesDataSource {
  getBySharedId(sharedId: string): Promise<ResultType<Page, PageNotFoundError>>;
  getAll(): Promise<Page[]>;
  create(page: Page): Promise<void>;
  update(page: Page): Promise<void>;
  deleteBySharedId(sharedId: string): Promise<void>;
  countPagesMissingLocale(language: string): Promise<number>;
}

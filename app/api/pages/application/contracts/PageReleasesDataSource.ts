import { PageReleaseSnapshot } from '#api/pages/domain/Page.js';
import { PageReleaseNotFoundError } from '#api/pages/domain/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

export interface PageReleasesDataSource {
  getMaxVersion(pageId: string): Promise<number>;
  insert(pageId: string, snapshot: PageReleaseSnapshot): Promise<void>;
  getByPageIdAndVersion(
    pageId: string,
    version: number
  ): Promise<ResultType<PageReleaseSnapshot, PageReleaseNotFoundError>>;
  listByPageId(pageId: string): Promise<PageReleaseSnapshot[]>;
  deleteByPageId(pageId: string): Promise<void>;
}

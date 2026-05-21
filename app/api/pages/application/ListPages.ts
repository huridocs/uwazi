import { PageType } from '#shared/types/pageType.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PageLocaleNotFoundError } from '#api/pages/domain/errors.js';
import { PageReleasesDataSource } from './contracts/PageReleasesDataSource.js';
import { PagesDataSource } from './contracts/PagesDataSource.js';
import { pageToClient } from '#api/pages/pageProjection.js';

type Input = {
  sharedId?: string;
  language?: string;
};

type Output = PageType[];

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
};

class ListPagesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    if (input.sharedId) {
      const pageResult = await this.deps.pagesDS.getBySharedId(input.sharedId);
      if (pageResult.isError()) {
        return [];
      }
      const lang = input.language ?? 'en';
      const page = pageResult.getDataOrThrow();
      const releases = await this.deps.pageReleasesDS.listByPageId(page.id);
      try {
        return [pageToClient(page, lang, releases)];
      } catch (error) {
        if (error instanceof PageLocaleNotFoundError) {
          return [];
        }
        throw error;
      }
    }

    const all = await this.deps.pagesDS.getAll();
    const lang = input.language;
    if (!lang) {
      return all.map(p => pageToClient(p, p.getLocaleKeys()[0] ?? 'en', []));
    }

    return Promise.all(
      all
        .filter(p => p.getLocaleKeys().includes(lang))
        .map(async p => {
          const releases = await this.deps.pageReleasesDS.listByPageId(p.id);
          return pageToClient(p, lang, releases);
        })
    );
  }
}

export { ListPagesUseCase };
export type { Input as ListPagesInput };

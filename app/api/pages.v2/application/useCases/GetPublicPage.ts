import { PageType } from '#shared/types/pageType.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { PageReleasesDataSource } from '../contracts/PageReleasesDataSource.js';
import { PagesDataSource } from '../contracts/PagesDataSource.js';
import { PageUnauthorizedError } from '#api/pages.v2/domain/errors.js';
import { loadClientPage } from '../services/pageClientLoader.js';

type Input = {
  sharedId: string;
  language?: string;
};

type Output = PageType;

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  settingsDS: SettingsDataSource;
};

class GetPublicPageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const settings = await this.deps.settingsDS.get();
    const lang = input.language ?? this.targetLanguage;

    const pageResult = await this.deps.pagesDS.getBySharedId(input.sharedId);
    if (pageResult.isError()) {
      throw pageResult.getError();
    }

    const page = pageResult.getDataOrThrow();
    if (settings.private && this.getActor().isAnonymous() && !page.embedPublic) {
      throw new PageUnauthorizedError();
    }

    return loadClientPage({ sharedId: input.sharedId }, lang, this.deps.pagesDS, this.deps.pageReleasesDS);
  }
}

export { GetPublicPageUseCase };
export type { Input as GetPublicPageInput };

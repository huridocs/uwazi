import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PagesDataSource } from '../contracts/PagesDataSource.js';
import { PageReleasesDataSource } from '../contracts/PageReleasesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { pageToClient } from '#api/pages.v2/application/services/pageProjection.js';
import { PageType } from '#shared/types/pageType.js';

type Input = {
  sharedId: string;
  version: number;
  language: string;
};

type Output = PageType;

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  settingsDS: SettingsDataSource;
};

class RestorePageDraftUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const pageResult = await this.deps.pagesDS.getBySharedId(input.sharedId);
    if (pageResult.isError()) {
      throw pageResult.getError();
    }

    const page = pageResult.getDataOrThrow();
    const releaseResult = await this.deps.pageReleasesDS.getByPageIdAndVersion(
      page.id,
      input.version
    );
    if (releaseResult.isError()) {
      throw releaseResult.getError();
    }

    const installedKeys = await this.deps.settingsDS.getLanguageKeys();
    page.applyReleaseToDraft(releaseResult.getDataOrThrow(), installedKeys);

    await this.transactionManager.run(async () => {
      await this.deps.pagesDS.update(page);
    });

    const releases = await this.deps.pageReleasesDS.listByPageId(page.id);
    return pageToClient(page, input.language, releases);
  }
}

export { RestorePageDraftUseCase };
export type { Input as RestorePageDraftInput };

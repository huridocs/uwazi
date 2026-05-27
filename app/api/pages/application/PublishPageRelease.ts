import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PagesDataSource } from './contracts/PagesDataSource.js';
import { PageReleasesDataSource } from './contracts/PageReleasesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { pageToClient } from '#api/pages/pageProjection.js';
import { PageType } from '#shared/types/pageType.js';

type Input = {
  sharedId: string;
  release_message: string;
  language: string;
};

type Output = PageType & { version: number };

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  settingsDS: SettingsDataSource;
};

class PublishPageReleaseUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const pageResult = await this.deps.pagesDS.getBySharedId(input.sharedId);
    if (pageResult.isError()) {
      throw pageResult.getError();
    }

    const page = pageResult.getDataOrThrow();
    const languageKeys = await this.deps.settingsDS.getLanguageKeys();
    const nextVersion = (await this.deps.pageReleasesDS.getMaxVersion(page.id)) + 1;

    const snapshot = page.buildRelease({
      releaseMessage: input.release_message,
      actorId: this.actorId!,
      date: Date.now(),
      languageKeys,
      nextVersion,
    });

    await this.transactionManager.run(async () => {
      await this.deps.pageReleasesDS.insert(page.id, snapshot);
    });

    const releases = await this.deps.pageReleasesDS.listByPageId(page.id);
    const client = pageToClient(page, input.language, releases);
    return { ...client, version: snapshot.version };
  }
}

export { PublishPageReleaseUseCase };
export type { Input as PublishPageReleaseInput };

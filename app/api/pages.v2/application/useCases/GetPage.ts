import { PageType } from '#shared/types/pageType.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PageReleasesDataSource } from '../contracts/PageReleasesDataSource.js';
import { PagesDataSource } from '../contracts/PagesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import {
  loadClientPage,
  loadClientPageForEditor,
  PageLookup,
} from '../services/pageClientLoader.js';

type Input = {
  lookup: string | PageLookup;
  language?: string;
  mode?: 'editor';
};

type Output = PageType;

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  settingsDS: SettingsDataSource;
};

class GetPageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    if (input.mode === 'editor') {
      return loadClientPageForEditor(
        input.lookup,
        this.deps.pagesDS,
        this.deps.pageReleasesDS,
        this.deps.settingsDS
      );
    }

    const lang = input.language ?? 'en';
    return loadClientPage(input.lookup, lang, this.deps.pagesDS, this.deps.pageReleasesDS);
  }
}

export { GetPageUseCase };
export type { Input as GetPageInput };

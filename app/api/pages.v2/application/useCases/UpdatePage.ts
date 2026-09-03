import { PageType } from '#shared/types/pageType.js';
import { validatePage, validatePageEditor } from '#shared/types/pageSchemaValidator.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { PagesDataSource } from '../contracts/PagesDataSource.js';
import { PageReleasesDataSource } from '../contracts/PageReleasesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import {
  applyClientToPage,
  applyEditorClientToPage,
  hasEditorLocalesPayload,
  pageToEditorClient,
} from '#api/pages.v2/application/services/pageProjection.js';
import { loadClientPage } from '../services/pageClientLoader.js';

type Input = {
  page: PageType & { sharedId: string };
  language?: string;
  editorResponse?: boolean;
};

type Output = PageType;

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  settingsDS: SettingsDataSource;
};

class UpdatePageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const lang = input.language ?? input.page.language ?? 'en';
    const clientPage: PageType = { ...input.page };
    const useEditorPayload = hasEditorLocalesPayload(clientPage);

    if (useEditorPayload) {
      await validatePageEditor(clientPage);
    } else {
      await validatePage(clientPage);
    }

    const languageKeys = await this.deps.settingsDS.getLanguageKeys();
    const returnEditorShape = input.editorResponse ?? useEditorPayload;

    const page = (await this.deps.pagesDS.getBySharedId(clientPage.sharedId!)).getDataOrThrow();

    if (useEditorPayload) {
      applyEditorClientToPage(page, clientPage, languageKeys);
    } else {
      page.entityView = clientPage.entityView ?? page.entityView;
      page.markdownSupport = clientPage.markdownSupport ?? page.markdownSupport;
      applyClientToPage(page, clientPage, lang);
    }
    await this.transactionManager.run(async () => {
      await this.deps.pagesDS.update(page);
    });

    if (returnEditorShape) {
      const releases = await this.deps.pageReleasesDS.listByPageId(page.id);
      return pageToEditorClient(page, languageKeys, releases);
    }
    return loadClientPage(
      { sharedId: clientPage.sharedId },
      lang,
      this.deps.pagesDS,
      this.deps.pageReleasesDS
    );
  }
}

export { UpdatePageUseCase };
export type { Input as UpdatePageInput };

import { ObjectId } from 'mongodb';
import ID from '#shared/uniqueID.js';
import { PageType } from '#shared/types/pageType.js';
import { validatePage, validatePageEditor } from '#shared/types/pageSchemaValidator.js';
import date from '#api/utils/date.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Page } from '#api/pages.v2/domain/Page.js';
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
  page: PageType;
  language?: string;
  editorResponse?: boolean;
};

type Output = PageType;

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  settingsDS: SettingsDataSource;
};

class CreatePageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const lang = input.language ?? input.page.language ?? 'en';
    const clientPage: PageType = { ...input.page };
    const useEditorPayload = hasEditorLocalesPayload(clientPage);

    if (useEditorPayload) {
      await validatePageEditor(clientPage);
    } else {
      await validatePage(clientPage);
    }

    if (this.getActor().isAnonymous()) {
      throw new Error('missing user');
    }

    const languageKeys = await this.deps.settingsDS.getLanguageKeys();
    const returnEditorShape = input.editorResponse ?? useEditorPayload;

    const sharedId = ID();
    const defaultTitle =
      useEditorPayload && clientPage.locales
        ? (clientPage.locales[lang]?.title ??
          clientPage.locales[languageKeys.find(k => clientPage.locales?.[k]) ?? '']?.title ??
          '')
        : (clientPage.title ?? '');

    const newPage = Page.createForNewPage({
      id: new ObjectId().toHexString(),
      sharedId,
      creationDate: date.currentUTC(),
      languageKeys,
      title: defaultTitle || 'New page',
      entityView: clientPage.entityView,
      markdownSupport: clientPage.markdownSupport === true,
    });

    if (useEditorPayload) {
      applyEditorClientToPage(newPage, clientPage, languageKeys);
    } else {
      applyClientToPage(newPage, clientPage, lang);
    }
    await this.transactionManager.run(async () => {
      await this.deps.pagesDS.create(newPage);
    });

    if (returnEditorShape) {
      return pageToEditorClient(newPage, languageKeys, []);
    }
    return loadClientPage({ sharedId }, lang, this.deps.pagesDS, this.deps.pageReleasesDS);
  }
}

export { CreatePageUseCase };
export type { Input as CreatePageInput };

import { ObjectId } from 'mongodb';
import ID from '#shared/uniqueID.js';
import { PageType } from '#shared/types/pageType.js';
import { validatePage, validatePageEditor } from '#shared/types/pageSchema.js';
import date from '#api/utils/date.js';
import { createError } from '#api/utils/index.js';
import { User } from '#api/users/usersModel.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Page } from '#api/pages/domain/Page.js';
import { PagesDataSource } from './contracts/PagesDataSource.js';
import { PageReleasesDataSource } from './contracts/PageReleasesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import {
  applyClientToPage,
  applyEditorClientToPage,
  hasEditorLocalesPayload,
  pageToEditorClient,
} from '#api/pages/pageProjection.js';
import { ensurePageSlugsAreUnique } from './ensurePageSlugsAreUnique.js';
import { loadClientPage, loadClientPageForEditor } from './pageClientLoader.js';

type Input = {
  page: PageType;
  user?: User;
  language?: string;
  editorResponse?: boolean;
};

type Output = PageType;

type Deps = {
  pagesDS: PagesDataSource;
  pageReleasesDS: PageReleasesDataSource;
  settingsDS: SettingsDataSource;
};

class SavePageUseCase extends AbstractUseCase<Input, Output, Deps> {
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

    if (clientPage.sharedId) {
      const existing = await this.deps.pagesDS.getBySharedId(clientPage.sharedId);
      if (existing.isError()) {
        return Promise.reject(createError('Page not found', 404));
      }
      const page = existing.getDataOrThrow();

      if (useEditorPayload) {
        applyEditorClientToPage(page, clientPage, languageKeys);
      } else {
        page.entityView = clientPage.entityView ?? page.entityView;
        page.markdownSupport = clientPage.markdownSupport ?? page.markdownSupport;
        applyClientToPage(page, clientPage, lang);
      }
      await ensurePageSlugsAreUnique(page, this.deps.pagesDS);

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

    if (!input.user) {
      throw new Error('missing user');
    }

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
      userId: input.user._id.toString(),
      creationDate: date.currentUTC(),
      languageKeys,
      title: defaultTitle || 'New page',
      entityView: clientPage.entityView,
      markdownSupport: clientPage.markdownSupport !== false,
    });

    if (useEditorPayload) {
      applyEditorClientToPage(newPage, clientPage, languageKeys);
    } else {
      applyClientToPage(newPage, clientPage, lang);
    }
    await ensurePageSlugsAreUnique(newPage, this.deps.pagesDS);

    await this.transactionManager.run(async () => {
      await this.deps.pagesDS.create(newPage);
    });

    if (returnEditorShape) {
      return pageToEditorClient(newPage, languageKeys, []);
    }
    return loadClientPage({ sharedId }, lang, this.deps.pagesDS, this.deps.pageReleasesDS);
  }
}

export { SavePageUseCase };
export type { Input as SavePageInput };

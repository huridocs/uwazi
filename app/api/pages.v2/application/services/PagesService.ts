import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PageType } from '#shared/types/pageType.js';
import { User } from '#api/users/usersModel.js';
import { SavePageUseCaseFactory } from '#api/pages.v2/infrastructure/factories/SavePageUseCaseFactory.js';
import { GetPageUseCaseFactory } from '#api/pages.v2/infrastructure/factories/GetPageUseCaseFactory.js';
import { ListPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/ListPagesUseCaseFactory.js';
import { DeletePageUseCaseFactory } from '#api/pages.v2/infrastructure/factories/DeletePageUseCaseFactory.js';
import { AddLanguageToPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/AddLanguageToPagesUseCaseFactory.js';
import { RemoveLanguageFromPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/RemoveLanguageFromPagesUseCaseFactory.js';
import type { PageLookup } from './pageClientLoader.js';

export type { PageLookup };

export class PagesService {
  async save(page: PageType, user?: User, language?: string) {
    const editorResponse = !!page.locales && Object.keys(page.locales).length > 0;
    return SavePageUseCaseFactory.default().execute({
      page,
      user,
      language,
      editorResponse,
    });
  }

  async get(query: { sharedId?: string; language?: string }) {
    return ListPagesUseCaseFactory.default().execute(query);
  }

  async getById(lookup: string | PageLookup, language?: string, mode?: 'editor') {
    return GetPageUseCaseFactory.default().execute({ lookup, language, mode });
  }

  async delete(sharedId: string) {
    return DeletePageUseCaseFactory.default().execute({ sharedId });
  }

  async addLanguage(language: LanguageISO6391, defaultLanguage: LanguageISO6391) {
    await AddLanguageToPagesUseCaseFactory.default().execute({ language, defaultLanguage });
  }

  async removeLanguage(language: LanguageISO6391) {
    await RemoveLanguageFromPagesUseCaseFactory.default().execute({ language });
  }
}

export default new PagesService();

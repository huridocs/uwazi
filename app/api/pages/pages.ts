import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { createError } from '#api/utils/index.js';
import { PagesDataSourceFactory } from '#api/pages.v2/infrastructure/factories/PagesDataSourceFactory.js';
import pagesService from './pagesService.js';
import { toLegacyHttpError } from './legacyHttpErrors.js';

const withLegacyErrors = async <T>(promise: Promise<T>): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    throw toLegacyHttpError(error);
  }
};

export default {
  async save(
    page: Parameters<typeof pagesService.save>[0],
    user?: Parameters<typeof pagesService.save>[1],
    language?: Parameters<typeof pagesService.save>[2]
  ) {
    return withLegacyErrors(pagesService.save(page, user, language));
  },

  async get(query: Parameters<typeof pagesService.get>[0]) {
    return withLegacyErrors(pagesService.get(query));
  },

  async getById(
    lookup: Parameters<typeof pagesService.getById>[0],
    language?: string,
    mode?: 'editor'
  ) {
    return withLegacyErrors(pagesService.getById(lookup, language, mode));
  },

  async delete(sharedId: string) {
    const templatesUsingPage = await templates.getByMongoQuery({
      entityViewPage: sharedId,
    });
    if (templatesUsingPage.length > 0) {
      const templatesTitles = templatesUsingPage.map(template => template.name);
      return Promise.reject(
        createError(
          `This page is in use by the following templates: ${templatesTitles.join(
            ', '
          )}. Remove the page from the templates before trying again.`,
          409
        )
      );
    }
    return withLegacyErrors(pagesService.delete(sharedId));
  },

  async addLanguage(language: string) {
    const settings = (await import('../settings/index.js')).default;
    const { languages } = await settings.get();
    const defaultLanguage = languages?.find(l => l.default)?.key ?? 'en';
    return withLegacyErrors(
      pagesService.addLanguage(language as LanguageISO6391, defaultLanguage as LanguageISO6391)
    );
  },

  async removeLanguage(language: LanguageISO6391) {
    return withLegacyErrors(pagesService.removeLanguage(language));
  },

  count: async () => {
    const pagesDS = PagesDataSourceFactory.default();
    const all = await pagesDS.getAll();
    return all.length;
  },
};

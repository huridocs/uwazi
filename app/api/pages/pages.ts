import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { createError } from '#api/utils/index.js';
import { PagesDataSourceFactory } from '#api/pages/infrastructure/factories/PagesDataSourceFactory.js';
import pagesService from './pagesService.js';

export default {
  save: pagesService.save.bind(pagesService),

  get: pagesService.get.bind(pagesService),

  getById(
    lookup: Parameters<typeof pagesService.getById>[0],
    language?: string,
    mode?: 'editor'
  ) {
    return pagesService.getById(lookup, language, mode);
  },

  async delete(sharedId: string) {
    const templatesUsingPage = await templates.get({
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
    return pagesService.delete(sharedId);
  },

  async addLanguage(language: string) {
    const settings = (await import('../settings/index.js')).default;
    const { languages } = await settings.get();
    const defaultLanguage = languages?.find(l => l.default)?.key ?? 'en';
    return pagesService.addLanguage(
      language as LanguageISO6391,
      defaultLanguage as LanguageISO6391
    );
  },

  removeLanguage: pagesService.removeLanguage.bind(pagesService),

  count: async () => {
    const pagesDS = PagesDataSourceFactory.default();
    const all = await pagesDS.getAll();
    return all.length;
  },
};

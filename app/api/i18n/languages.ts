import settings from 'api/settings/settings';
import translations from 'api/i18n/translations';
import entities from 'api/entities/entities';
import pages from 'api/pages';
import { DB } from 'api/odm';
import { LanguageSchema } from 'shared/types/commonTypes';

export const Languages = {
  add: async (language: LanguageSchema) => {
    const session = await DB.getSession();
    let newSettings;
    let newTranslations;

    try {
      await session.withTransaction(async () => {
        newSettings = await settings.addLanguage(language, session);
        newTranslations = await translations.addLanguage(language.key, session);
        await entities.addLanguage(language.key);
        await pages.addLanguage(language.key);
      });
    } catch (e) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
    await session.commitTransaction();

    return { newSettings, newTranslations };
  },
};

import settings from 'api/settings/settings';
import translations from 'api/i18n/translations';
import translationsModel from 'api/i18n/translationsModel';
import entities from 'api/entities/entities';
import pages from 'api/pages';
import { LanguageSchema } from 'shared/types/commonTypes';
import { handleError } from 'api/utils';

export const Languages = {
  add: async (language: LanguageSchema) => {
    const session = await translationsModel.startSession();
    let newSettings;
    let newTranslations;

    await session.withTransaction(async () => {
      try {
        newSettings = await settings.addLanguage(language, session);
        newTranslations = await translations.addLanguage(language.key, session);
        await entities.addLanguage(language.key);
        await pages.addLanguage(language.key);
        await session.commitTransaction();
      } catch (e) {
        await session.abortTransaction();
        handleError(e);
      } finally {
        session.endSession();
      }
    });
    return { newSettings, newTranslations };
  },
};

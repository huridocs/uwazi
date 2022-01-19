import settings from 'api/settings/settings';
import translations from 'api/i18n/translations';
import translationsModel from 'api/i18n/translationsModel';
import entities from 'api/entities/entities';
import pages from 'api/pages';
import { LanguageSchema } from 'shared/types/commonTypes';
import { handleError } from 'api/utils';
import { ExecutionOptions } from 'api/odm';

async function addLanguage(language: LanguageSchema, options?: ExecutionOptions) {
  const newSettings = await settings.addLanguage(language, options);
  /*const newTranslations = await translations.addLanguage(language.key, options);
  await entities.addLanguage(language.key);
  await pages.addLanguage(language.key);*/
  return { newSettings, newTranslations: null };
}

export const Languages = {
  add: async (language: LanguageSchema) => {
    const session = await translationsModel.startSession();
    let newSettings;
    let newTranslations;
    if (session) {
      await session.withTransaction(async () => {
        const options = { session };
        try {
          ({ newSettings, newTranslations } = await addLanguage(language, options));
          await session.commitTransaction();
        } catch (e) {
          await session.abortTransaction();
          handleError(e);
        } finally {
          session.endSession();
        }
      });
    } else {
      ({ newSettings, newTranslations } = await addLanguage(language));
    }
    return { newSettings, newTranslations };
  },
};

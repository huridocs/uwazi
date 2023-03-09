import { ClientTranslationSchema } from 'app/istore';
import { availableLanguages } from 'shared/languagesList';

const getTableValue = (translations: ClientTranslationSchema[], term: string) =>
  translations.map(language => {
    const context = language.contexts[0];
    const value = context.values[term];
    const languaLabel = availableLanguages.find(
      availableLanguage => availableLanguage.key === language.locale
    )?.localized_label;
    return { language: languaLabel, languageKey: language.locale, value };
  });

export { getTableValue };

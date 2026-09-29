import { LanguageSchema } from '#shared/types/commonTypes.js';

type TableLanguages = LanguageSchema & { rowId: string };

const toTableLanguages = (
  availableLanguages: LanguageSchema[],
  collectionLanguages: LanguageSchema[]
): TableLanguages[] => {
  const availableByKey = new Map(availableLanguages.map(language => [language.key, language]));

  return collectionLanguages.map(language => {
    const available = availableByKey.get(language.key);
    return {
      ...available,
      ...language,
      translationAvailable: available?.translationAvailable,
      default: language.default === true,
      rowId: language.key,
    };
  });
};

export type { TableLanguages };
export { toTableLanguages };

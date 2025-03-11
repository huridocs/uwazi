import { LanguageSchema } from 'shared/types/commonTypes';

const getLanguageName = (languagePool: LanguageSchema[], languageKey: string) => {
  const { label = languageKey } = languagePool.find(pool => pool.key === languageKey) || {};
  return label;
};

export { getLanguageName };

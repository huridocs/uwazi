import { LanguageUtils, availableLanguages } from 'shared/language';

export default ({ language }) => {
  const languageKey = LanguageUtils.fromISO639_3(language).ISO639_1;
  const laguageData = availableLanguages.find(l => l.key === languageKey) || {};
  return `force-${laguageData.rtl ? 'rtl' : 'ltr'}`;
};

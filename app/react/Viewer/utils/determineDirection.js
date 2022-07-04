import {
  language as francLanguages,
  availableLanguages as languagesList,
} from 'shared/languagesList';

export default ({ language }) => {
  const languageKey = francLanguages(language, 'ISO639_1');
  const laguageData = languagesList.find(l => l.key === languageKey) || {};
  return `force-${laguageData.rtl ? 'rtl' : 'ltr'}`;
};

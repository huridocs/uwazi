import francLanguages from 'shared/languagesList';
import languagesList from '../../Settings/utils/languagesList';

export default ({ language }) => {
  const languageKey = francLanguages(language, 'ISO639_1');
  const laguageData = languagesList.find(l => l.key === languageKey) || {};
  return `force-${laguageData.rtl ? 'rtl' : 'ltr'}`;
};

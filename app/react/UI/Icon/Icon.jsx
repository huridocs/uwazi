import PropTypes from 'prop-types';
import React from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { availableLanguages } from '#shared/language/index.js';
import { loadIcons } from '#UI/Icon/library.js';

if (typeof window !== 'undefined') {
  loadIcons();
}

const Icon = ({ locale: propLocale = '', ...ownProps }) => {
  const atomLocale = useAtomValue(localeAtom);
  const locale = propLocale || atomLocale;
  const languageData = availableLanguages.find(l => l.key === locale);
  const flip = languageData && languageData.rtl ? 'horizontal' : null;

  return <FontAwesomeIcon {...ownProps} flip={flip} />;
};

Icon.propTypes = {
  locale: PropTypes.string,
};

export default Icon;

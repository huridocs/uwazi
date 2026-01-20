import PropTypes from 'prop-types';
import React from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { availableLanguages } from '#shared/language/index.js';
import { loadIcons } from './library.js';
import { FlipProp } from '@fortawesome/fontawesome-svg-core';

loadIcons();

const Icon = ({ locale: propLocale = '', ...ownProps }) => {
  const atomLocale = useAtomValue(localeAtom);
  const locale = propLocale || atomLocale;
  const languageData = availableLanguages.find(l => l.key === locale);
  const flip = languageData && languageData.rtl ? 'horizontal' : null;

  return <FontAwesomeIcon {...ownProps} flip={flip as FlipProp} icon={ownProps.icon} />;
};

Icon.propTypes = {
  locale: PropTypes.string,
};

export default Icon;

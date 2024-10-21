import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { availableLanguages as languagesList } from 'shared/languagesList';
import { loadIcons } from './library';

loadIcons();

const Icon = ({ locale = '', ...ownProps }) => {
  const languageData = languagesList.find(l => l.key === locale);
  return (
    <FontAwesomeIcon {...ownProps} flip={languageData && languageData.rtl ? 'horizontal' : null} />
  );
};

Icon.propTypes = {
  locale: PropTypes.string,
};

export const mapStateToProps = ({ locale }) => ({ locale });

export default connect(mapStateToProps, () => ({}))(Icon);

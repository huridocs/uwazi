import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import laguagesList from 'app/Settings/utils/languagesList';

const Icon = ({ locale, directionAware, ...ownProps }) => {
  const languageData = laguagesList.find(l => l.key === locale);
  return <FontAwesomeIcon {...ownProps} flip={languageData && languageData.rtl ? 'horizontal' : null} />;
};

Icon.defaultProps = {
  locale: '',
  directionAware: false,
};

Icon.propTypes = {
  locale: PropTypes.string,
  directionAware: PropTypes.bool,
};

export const mapStateToProps = ({ locale }) => ({ locale });

export default connect(mapStateToProps, () => ({}))(Icon);

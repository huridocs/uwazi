import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import laguagesList from 'app/Settings/utils/languagesList';

const DirectionAwareIcon = ({ locale, ...ownProps }) => {
  const languageData = laguagesList.find(l => l.key === locale);
  return <FontAwesomeIcon {...ownProps} flip={languageData && languageData.rtl ? 'horizontal' : null} />;
};

DirectionAwareIcon.defaultProps = {
  locale: '',
};

DirectionAwareIcon.propTypes = {
  locale: PropTypes.string,
};

export const mapStateToProps = ({ locale }) => ({ locale });

export default connect(mapStateToProps, () => ({}))(DirectionAwareIcon);

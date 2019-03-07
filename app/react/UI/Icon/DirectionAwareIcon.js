import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import laguagesList from 'app/Settings/utils/languagesList';

const DirectionAwareIcon = ({ locale, ownProps }) => {
  const iconProps = { ...ownProps };
  const languageData = laguagesList.find(l => l.key === locale);

  if (languageData && languageData.rtl) {
    iconProps.flip = 'horizontal';
  }

  return <FontAwesomeIcon {...iconProps} />;
};

DirectionAwareIcon.defaultProps = {
  locale: '',
  ownProps: {},
};

DirectionAwareIcon.propTypes = {
  locale: PropTypes.string,
  ownProps: PropTypes.object,
};

export const mapStateToProps = ({ locale }, ownProps) => ({ locale, ownProps });

export default connect(mapStateToProps)(DirectionAwareIcon);

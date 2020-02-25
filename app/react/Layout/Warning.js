import PropTypes from 'prop-types';
import React from 'react';
import { Icon } from 'UI';

const Warning = ({ children, inline }) =>
  inline ? (
    <div className="alert alert-warning fade in">
      <Icon icon="exclamation-triangle" />
      {children}
    </div>
  ) : (
    <span className="property-help">
      <Icon icon="exclamation-triangle" />
      <div className="property-description">{children}</div>
    </span>
  );

Warning.defaultProps = {
  inline: false,
};

Warning.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  inline: PropTypes.bool,
};

export default Warning;

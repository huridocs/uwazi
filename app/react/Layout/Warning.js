import PropTypes from 'prop-types';
import React from 'react';
import { Icon } from 'UI';

const Tip = ({ children, inline }) => (
  inline ?
    <div className="alert alert-warning fade in">
      <Icon icon="exclamation-triangle" />
      {children}
    </div>
    :
    <span className="property-help">
      <Icon icon="exclamation-triangle" />
      <div className="property-description">
        {children}
      </div>
    </span>
);

Tip.defaultProps = {
  inline: false
};

Tip.propTypes = {
  children: PropTypes.string.isRequired,
  inline: PropTypes.bool
};

export default Tip;

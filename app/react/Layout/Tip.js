import PropTypes from 'prop-types';
import React from 'react';
import { Icon } from 'UI';

const Tip = ({ children, icon }) => (
  <span className="property-help">
    <Icon icon={icon} />
    <div className="property-description">{children}</div>
  </span>
);

Tip.defaultProps = {
  icon: 'question-circle',
};

Tip.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.string,
};

export default Tip;

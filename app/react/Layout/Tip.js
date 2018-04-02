import PropTypes from 'prop-types';
import React from 'react';

const Tip = ({ children }) => (
  <i className="property-help fa fa-question-circle">
    <div className="property-description">
      {children}
    </div>
  </i>
);

Tip.propTypes = {
  children: PropTypes.string.isRequired
};

export default Tip;

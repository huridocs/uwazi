import React from 'react';
import PropTypes from 'prop-types';

function ProgressBar({ max, value }) {
  const percentage = (100 * value) / max;
  return (
    <div className="uw-progress-bar--container">
      <div className="uw-progress-bar">
        <div className="uw-progress-bar--progress" style={{ width: `${percentage}%` }} />
      </div>
      <div className="uw-progress-bar--counter">
        {value}/{max}
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  max: PropTypes.number,
  value: PropTypes.number,
};

ProgressBar.defaultProps = {
  max: 100,
  value: 0,
};

export default ProgressBar;

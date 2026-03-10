import PropTypes from 'prop-types';
import React from 'react';

const Main = ({ children, onClick, disabled }) => (
  <div className={`float-btn__main ${disabled ? 'disabled' : 'cta'}`} onClick={onClick}>
    {children}
  </div>
);

const childrenType = PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]);

Main.propTypes = { children: childrenType, onClick: PropTypes.func, disabled: PropTypes.bool };

export { Main };

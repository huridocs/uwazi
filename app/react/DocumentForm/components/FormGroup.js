import PropTypes from 'prop-types';
import React from 'react';

const FormGroup = props => {
  let className = `${props.className} form-group`;
  if ((!props.pristine || props.submitFailed) && props.valid === false) {
    className += ' has-error';
  }

  return <div className={className}>{props.children}</div>;
};

const childrenType = PropTypes.oneOfType([PropTypes.object, PropTypes.array]);

FormGroup.defaultProps = {
  className: '',
};

FormGroup.propTypes = {
  className: PropTypes.string,
  pristine: PropTypes.bool,
  valid: PropTypes.bool,
  submitFailed: PropTypes.bool,
  children: childrenType,
};

export default FormGroup;

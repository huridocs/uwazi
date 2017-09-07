import PropTypes from 'prop-types';
import React from 'react';

const FormGroup = (props) => {
  let className = 'form-group';
  if ((!props.pristine || props.submitFailed) && props.valid === false) {
    className += ' has-error';
  }

  return (
    <div className={className}>
      {props.children}
    </div>
  );
};

let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array
]);

FormGroup.propTypes = {
  pristine: PropTypes.bool,
  valid: PropTypes.bool,
  submitFailed: PropTypes.bool,
  children: childrenType
};

export default FormGroup;

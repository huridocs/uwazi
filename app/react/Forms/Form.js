/* eslint-disable max-classes-per-file */
//TODO: replace react redux form
import PropTypes from 'prop-types';
import React from 'react';
import { LocalForm as RRLF, Form as RRF } from 'react-redux-form';

// Compatibility wrapper for React 19
const Form = React.forwardRef((props, ref) => {
  const { children, ...restProps } = props;
  return React.createElement(RRF, { ...restProps, ref }, children);
});

Form.propTypes = {
  children: PropTypes.node.isRequired,
};

Form.displayName = 'Form';

const LocalForm = React.forwardRef((props, ref) => {
  const { children, ...restProps } = props;
  return React.createElement(RRLF, { ...restProps, ref }, children);
});

LocalForm.propTypes = {
  children: PropTypes.node.isRequired,
};

LocalForm.displayName = 'LocalForm';

export { Form, LocalForm };

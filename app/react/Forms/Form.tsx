/* eslint-disable max-classes-per-file */
/* eslint-disable react/prop-types */
//TODO: replace react redux form
import React from 'react';
import { LocalForm as RRLF, Form as RRF } from 'react-redux-form';

interface FormProps {
  children: React.ReactNode;
  model?: string;
  onSubmit?: (values: any) => void;
  getDispatch?: (dispatch: Function) => void;
  validators?: Record<string, any>;
  initialState?: any;
  className?: string;
  [key: string]: any;
}

interface LocalFormProps {
  children: React.ReactNode;
  model?: string;
  onSubmit?: (values: any) => void;
  getDispatch?: (dispatch: Function) => void;
  validators?: Record<string, any>;
  initialState?: any;
  className?: string;
  [key: string]: any;
}

// Compatibility wrapper for React 19
const Form: React.ComponentType<FormProps> = props => {
  const { children, model = '', ...restProps } = props;
  return React.createElement(RRF, { model, ...restProps }, children);
};

Form.displayName = 'Form';

const LocalForm: React.ComponentType<LocalFormProps> = props => {
  const { children, ...restProps } = props;
  return React.createElement(RRLF, restProps, children);
};

LocalForm.displayName = 'LocalForm';

export { Form, LocalForm };

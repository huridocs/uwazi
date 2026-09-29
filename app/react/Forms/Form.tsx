import { createElement, type ReactNode } from 'react';
import PropTypes from 'prop-types';
import { Form as ReduxForm } from 'react-redux-form';
import type { FormProps } from 'react-redux-form';
import { LocalForm } from './LocalForm.js';

type FormWithChildren = FormProps & { children?: ReactNode };

function Form({ children, ...props }: FormWithChildren) {
  return createElement(ReduxForm, props, children);
}

Form.propTypes = {
  children: PropTypes.node.isRequired,
};

export { Form, LocalForm };

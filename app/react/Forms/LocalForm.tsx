import { createElement, type ComponentProps, type ReactNode } from 'react';
import PropTypes from 'prop-types';
import { LocalForm as ReduxLocalForm } from 'react-redux-form';

type LocalFormWithChildren = ComponentProps<typeof ReduxLocalForm> & { children?: ReactNode };

function LocalForm({ children, ...props }: LocalFormWithChildren) {
  return createElement(ReduxLocalForm, props, children);
}

LocalForm.propTypes = {
  children: PropTypes.node.isRequired,
};

export { LocalForm };

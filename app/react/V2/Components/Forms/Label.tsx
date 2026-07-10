import React from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

interface LabelProps {
  htmlFor: string;
  children: string | React.ReactNode;
  hasErrors?: boolean;
  hideLabel?: boolean;
}

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const Label = ({ htmlFor, children, hasErrors, hideLabel }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={
      hideLabel
        ? 'sr-only'
        : `mb-2 block ${hasErrors ? 'text-(--color-theme-control-text-error)' : 'text-ink-secondary'}`
    }
  >
    {renderChild(children)}
  </label>
);

export { Label };

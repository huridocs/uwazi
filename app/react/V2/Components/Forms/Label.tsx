import React from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

interface LabelProps {
  htmlFor?: string;
  children: string | React.ReactNode;
  hasErrors?: boolean;
  hideLabel?: boolean;
}

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const Label = ({ htmlFor, children, hasErrors = false, hideLabel }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={
      hideLabel ? 'sr-only' : cx('block text-sm font-bold', hasErrors ? 'text-seal' : 'text-ink')
    }
  >
    {renderChild(children)}
  </label>
);

export { Label };

import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { isString } from 'lodash';

interface InputErrorProps {
  children?: string | React.ReactNode;
  className?: string;
}

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const InputError = ({ children, className = '' }: InputErrorProps) => (
  <p className={`${className} mt-2 text-sm text-error-600`}>{renderChild(children)}</p>
);

export { InputError };

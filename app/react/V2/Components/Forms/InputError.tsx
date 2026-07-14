import React from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

interface InputErrorProps {
  children?: string | React.ReactNode;
  className?: string;
}

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const InputError = ({ children, className = '' }: InputErrorProps) => (
  <p className={`${className} mt-2 text-sm text-seal`.trim()}>{renderChild(children)}</p>
);

export { InputError };

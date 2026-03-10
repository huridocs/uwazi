import React from 'react';
import { Translate } from 'app/I18N';
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

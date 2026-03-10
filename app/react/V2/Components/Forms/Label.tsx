import React from 'react';
import { Translate } from 'app/I18N';
import { isString } from 'lodash';

interface LabelProps {
  htmlFor: string;
  children: string | React.ReactNode;
  hasErrors?: boolean;
  hideLabel?: boolean;
}

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const Label = ({ htmlFor, children, hasErrors, hideLabel }: LabelProps) => {
  let labelStyles = 'block mb-2 text-sm font-medium text-gray-700';

  if (hasErrors) {
    labelStyles = 'block mb-2 text-sm font-medium text-error-700';
  }

  return (
    <label htmlFor={htmlFor} className={hideLabel ? 'sr-only' : labelStyles}>
      {renderChild(children)}
    </label>
  );
};

export { Label };

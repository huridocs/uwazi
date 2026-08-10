/* eslint-disable react/jsx-props-no-spreading */
import React, { type ReactNode } from 'react';

type EntityFieldProps = {
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
};

const EntityField = ({ children, className = '', ...rest }: EntityFieldProps) => (
  <div className={`flex flex-col gap-1.5 text-ink ${className}`.trim()} {...rest}>
    {children}
  </div>
);

export { EntityField };

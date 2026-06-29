import React, { PropsWithChildren } from 'react';

type PropertyValueProps = PropsWithChildren<{
  className?: string;
  as?: 'dd' | 'span' | 'div';
}>;

const PropertyValue = ({ children, className = '', as: Tag = 'span' }: PropertyValueProps) => (
  <Tag className={['text-sm font-medium text-ink', className].filter(Boolean).join(' ')}>
    {children}
  </Tag>
);

export { PropertyValue };

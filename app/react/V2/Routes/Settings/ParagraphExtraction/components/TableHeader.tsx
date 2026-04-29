import React from 'react';

const TableHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`font-semibold text-xs [color:var(--color-theme-text-secondary)] ${className}`.trim()}
  >
    {children}
  </span>
);

export { TableHeader };

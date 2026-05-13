import React from 'react';

const TableHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span className={`font-semibold text-xs text-ink-secondary ${className}`.trim()}>{children}</span>
);

export { TableHeader };

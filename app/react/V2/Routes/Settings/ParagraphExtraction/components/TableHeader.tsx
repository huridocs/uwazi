import React from 'react';

const TableHeader = ({
  children,
  className = 'text-gray-500 font-semibold text-xs',
}: {
  children: React.ReactNode;
  className?: string;
}) => <span className={`${className}`}>{children}</span>;

export { TableHeader };

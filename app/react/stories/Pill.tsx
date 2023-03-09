import React from 'react';

interface PillProps {
  children: string | React.ReactNode;
  style?: 'default' | 'active';
}

const Pill = ({ children, style = 'default' }: PillProps) => {
  const className =
    style === 'default' ? 'bg-gray-100 text-gray-900' : 'bg-yellow-100 text-yellow-800';
  return <span className={`mr-2 px-2.5 py-0.5 rounded text-xs ${className}`}>{children}</span>;
};

export { Pill };

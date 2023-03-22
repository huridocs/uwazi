import React from 'react';

interface PillProps {
  children: string | React.ReactNode;
  color: 'primary' | 'gray' | 'yellow';
}

const Pill = ({ children, color = 'gray' }: PillProps) => {
  let pillColors = '';

  switch (color) {
    case 'gray':
      pillColors = 'bg-gray-100';
      break;

    case 'yellow':
      pillColors = 'bg-yellow-100 text-yellow-800';
      break;

    default:
      pillColors = 'bg-primary-100';
      break;
  }
  return <span className={`mr-2 px-2.5 py-1 rounded-md ${pillColors}`}>{children}</span>;
};

export { Pill };

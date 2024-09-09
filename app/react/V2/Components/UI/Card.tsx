import React from 'react';

interface CardProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  color?: 'default' | 'yellow';
}

const Card = ({ title, children, className, color = 'default' }: CardProps) => {
  let headerColor;

  switch (color) {
    case 'yellow':
      headerColor = 'bg-yellow-100 text-yellow-800';
      break;
    default:
      headerColor = 'bg-gray-50 text-primary-700';
  }

  return (
    <div className={`border rounded-md border-gray-50 shadow-sm ${className}`}>
      {title && (
        <div className={`block w-full font-semibold text-base p-4 ${headerColor}`}>{title}</div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export { Card };

import React from 'react';

interface CardProps {
  title: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card = ({ title, children, className }: CardProps) => (
  <div className={`border rounded-md border-gray-50 shadow-sm ${className}`}>
    <div className="block w-full bg-gray-50 text-primary-700 font-semibold text-base p-4">
      {title}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export { Card };

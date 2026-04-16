import React from 'react';

const Dot = ({ color }: { color?: 'red' | 'orange' | 'green' }) => {
  const palette: Record<string, string> = {
    red: 'bg-error-500',
    orange: 'bg-alert-500',
    green: 'bg-success-500',
  };
  const colorClass = palette[color || 'green'] || palette.green;
  return <div className={`block w-3 h-3 ${colorClass} rounded-xl`} aria-hidden />;
};

export { Dot };

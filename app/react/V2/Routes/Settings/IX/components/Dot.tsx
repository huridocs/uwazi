import React from 'react';

const Dot = ({ color }: { color?: 'red' | 'orange' | 'green' }) => {
  let colorClass = 'bg-green-400';
  switch (color) {
    case 'red':
      colorClass = 'bg-orange-500';
      break;
    case 'green':
      colorClass = 'bg-green-400';
      break;
    case 'orange':
      colorClass = 'bg-orange-300';
      break;
    default:
      colorClass = 'bg-green-400';
  }
  return <div className={`block w-3 h-3 ${colorClass} rounded-xl`}></div>;
};

export { Dot };

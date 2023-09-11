import React, { MouseEventHandler } from 'react';

interface ButtonProps {
  children: string | React.ReactNode;
  type?: 'submit' | 'button';
  color?: 'orange' | 'green' | 'red' | 'indigo' | 'white';
  disabled?: boolean;
  form?: string;
  onClick?: MouseEventHandler;
  className?: string;
  icon?: React.ReactNode;
  collapsed?: boolean;
}

const EmbededButton = ({
  color = 'white',
  children,
  type = 'button',
  disabled,
  form,
  onClick,
  icon,
  collapsed,
  className = '',
}: ButtonProps) => {
  let buttonColor = '';
  switch (color) {
    case 'orange':
      buttonColor =
        'text-orange-400 bg-orange-100 border-orange-200 disabled:text-orange-200 disabled:bg-orange-50 disabled:border-orange-200';
      break;
    case 'green':
      buttonColor =
        'text-green-400 bg-green-100 border-green-200 disabled:text-green-200 disabled:bg-green-50 disabled:border-green-200';
      break;
    case 'red':
      buttonColor =
        'text-red-700 bg-red-200 border-red-300 disabled:text-red-200 disabled:bg-red-50 disabled:border-red-200';
      break;
    case 'indigo':
      buttonColor =
        'text-indigo-700 bg-indigo-200 border-indigo-300 disabled:text-indigo-200 disabled:bg-indigo-50 disabled:border-indigo-200';
      break;
    case 'white':
      buttonColor = 'bg-white border-gray-200 disabled:text-gray-300 disabled:bg-gray-50';
      break;
    default:
      buttonColor = '';
  }

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonColor} 
      ${collapsed || disabled ? '' : 'border'}
      ${collapsed || disabled ? 'px-[7px] py-[3px]' : 'px-1.5 py-0.5'}
      drop-shadow-md disabled:drop-shadow-none active:drop-shadow-none text-xs disabled:cursor-not-allowed font-medium rounded-[4px]
      focus:outline-none ${className}`}
      form={form}
    >
      <div className="flex flex-row items-center justify-center gap-1">
        <div className="w-3 h-3 text-xs">{icon}</div>
        {!collapsed ? <div className="text-xs font-medium">{children}</div> : undefined}
      </div>
    </button>
  );
};

export { EmbededButton };

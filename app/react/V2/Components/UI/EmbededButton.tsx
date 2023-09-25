import React, { MouseEventHandler } from 'react';

interface ButtonProps {
  children: string | React.ReactNode;
  type?: 'submit' | 'button';
  color?: 'orange' | 'green' | 'red' | 'indigo';
  disabled?: boolean;
  form?: string;
  onClick?: MouseEventHandler;
  className?: string;
  icon: React.ReactNode;
  collapsed: boolean;
}

const EmbededButton = ({
  color,
  children,
  type = 'button',
  disabled,
  form,
  onClick,
  icon,
  collapsed,
  className = '',
}: ButtonProps) => {
  let buttonColor = 'green';
  let childrenBaseStyle = 'text-sm font-medium';

  switch (color) {
    case 'orange':
      buttonColor = 'text-orange-400 bg-orange-50';
      break;
    case 'green':
      buttonColor = 'text-green-400 bg-green-100';
      break;
    case 'red':
      buttonColor = 'bg-gray-50';
      childrenBaseStyle = 'text-gray-300';
      break;
    case 'indigo':
      buttonColor = 'text-indigo-400 bg-indigo-50';
      break;
    default:
      buttonColor = '';
  }

  if (collapsed) {
    childrenBaseStyle = 'sr-only';
  }

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonColor} shadow-sm text-xs px-1.5 py-0.5 disabled:cursor-not-allowed font-medium rounded-[4px]
      focus:outline-none hover:border-none ${className}`}
      form={form}
    >
      <div className="flex flex-row gap-1 justify-center items-center">
        <div className="w-3 h-3 text-sm">{icon}</div>
        <div className={childrenBaseStyle}>{children}</div>
      </div>
    </button>
  );
};

export { EmbededButton };

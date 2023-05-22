import React, { MouseEventHandler } from 'react';

interface ButtonProps {
  children: string | React.ReactNode;
  buttonStyle?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  type?: 'submit' | 'button';
  size?: 'small' | 'medium';
  disabled?: boolean;
  formId?: string;
  onClick?: MouseEventHandler;
  className?: string;
}

const Button = ({
  children,
  buttonStyle = 'primary',
  type = 'button',
  size,
  disabled,
  formId,
  onClick,
  className = '',
}: ButtonProps) => {
  let classNames;
  const textStyles = size === 'small' ? 'text-xs px-3 py-1.5' : 'text-sm px-5 py-2.5';

  switch (buttonStyle) {
    case 'secondary':
      classNames =
        'text-primary-700 bg-white border-primary-700 disabled:text-primary-300 disabled:border-primary-300 enabled:hover:bg-primary-800 enabled:hover:text-white enabled:hover:border-primary-800';
      break;

    case 'tertiary':
      classNames =
        'text-gray-700 disabled:text-gray-300 bg-white border-gray-200 enabled:hover:text-primary-700';
      break;
    case 'danger':
      classNames =
        'text-white bg-error-700 border-error-700 disabled:bg-error-300 disabled:border-error-300 enabled:hover:bg-error-800 enabled:hover:border-error-800';
      break;
    default:
      classNames =
        'text-white bg-primary-700 border-primary-700 disabled:bg-primary-300 disabled:border-primary-300 enabled:hover:bg-primary-800 enabled:hover:border-primary-800';
      break;
  }

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`${classNames} ${textStyles} disabled:cursor-not-allowed font-medium rounded-lg
      border focus:outline-none focus:ring-4 focus:ring-indigo-200 ${className}`}
      form={formId}
    >
      {children}
    </button>
  );
};

export { Button };

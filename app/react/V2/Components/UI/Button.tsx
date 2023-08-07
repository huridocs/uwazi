import React, { MouseEventHandler } from 'react';

interface ButtonProps {
  children: string | React.ReactNode;
  styling?: 'solid' | 'outline' | 'light';
  color?: 'primary' | 'error' | 'success';
  type?: 'submit' | 'button';
  size?: 'small' | 'medium';
  disabled?: boolean;
  form?: string;
  onClick?: MouseEventHandler;
  className?: string;
}

const Button = ({
  children,
  styling = 'solid',
  color = 'primary',
  type = 'button',
  size,
  disabled,
  form,
  onClick,
  className = '',
}: ButtonProps) => {
  let classNames;
  const textStyles = size === 'medium' ? 'text-sm px-5 py-2.5' : 'text-xs px-3 py-2';

  let bgColor;
  let bgDisabled;
  let border;
  let borderHover;
  let text;
  let textDisabled;
  let textHover;
  let borderDisabled;
  let bgHover;
  switch (color) {
    case 'error':
      bgColor = 'bg-error-700';
      bgHover = 'enabled:hover:bg-error-800';
      bgDisabled = ' disabled:bg-error-300';
      border = 'border-error-700';
      borderHover = 'enabled:hover:border-error-800';
      borderDisabled = 'disabled:border-error-300';
      text = 'text-error-700';
      textDisabled = 'disabled:text-error-300';
      textHover = 'enabled:hover:text-error-700';
      break;

    case 'success':
      bgColor = 'bg-success-700';
      bgHover = 'enabled:hover:bg-success-700';
      bgDisabled = ' disabled:bg-success-300';
      border = 'border-success-700';
      borderHover = 'enabled:hover:border-success-800';
      borderDisabled = 'disabled:border-success-300';
      text = 'text-success-700';
      textDisabled = 'disabled:text-success-300';
      textHover = 'enabled:hover:text-success-700';
      break;

    default:
      bgColor = 'bg-primary-700';
      bgHover = 'enabled:hover:bg-primary-800';
      bgDisabled = ' disabled:bg-primary-300';
      border = 'border-primary-700';
      borderHover = 'enabled:hover:border-primary-800';
      borderDisabled = 'disabled:border-primary-300';
      text = 'text-primary-700';
      textDisabled = 'disabled:text-primary-300';
      textHover = 'enabled:hover:text-primary-700';
      break;
  }

  switch (styling) {
    case 'outline':
      classNames = `bg-white enabled:hover:text-white ${text} ${border} ${textDisabled} ${borderDisabled} ${bgHover} ${borderHover}`;
      break;
    case 'light':
      classNames = `text-gray-700 disabled:text-gray-300 bg-white border-gray-200 ${textHover}`;
      break;

    default:
      classNames = `text-white ${bgColor} ${border} ${bgDisabled} ${borderDisabled} ${bgHover} ${borderHover}`;
      break;
  }

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      className={`${classNames} ${textStyles} disabled:cursor-not-allowed font-medium rounded-lg
      border focus:outline-none focus:ring-4 focus:ring-indigo-200 ${className}`}
      form={form}
    >
      {children}
    </button>
  );
};

export { Button };

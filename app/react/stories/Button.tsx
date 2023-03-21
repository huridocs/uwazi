import React from 'react';

interface ButtonProps {
  children: string | React.ReactNode;
  buttonStyle?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium';
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClickFuntion?: () => any;
}

const Button = ({
  children,
  buttonStyle = 'primary',
  type = 'button',
  disabled,
  onClickFuntion,
  size,
}: ButtonProps) => {
  let classNames;
  const textStyles =
    size === 'small' ? 'text-xs px-3 py-1.5 mr-1 mb-1' : 'text-sm px-5 py-2.5 mr-2 mb-2';

  switch (buttonStyle) {
    case 'secondary':
      classNames =
        'text-primary-700 bg-white border-primary-700 disabled:text-primary-300 disabled:border-primary-300 enabled:hover:bg-primary-800 enabled:hover:text-white enabled:hover:border-primary-800';
      break;

    case 'tertiary':
      classNames =
        'text-gray-700 disabled:text-gray-300 bg-white border-gray-200 enabled:hover:text-primary-700';
      break;

    default:
      classNames =
        'text-white bg-primary-700 border-primary-700 disabled:bg-primary-300 disabled:border-primary-300 enabled:hover:bg-primary-800 enabled:hover:border-primary-800';
      break;
  }

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClickFuntion}
      disabled={disabled}
      className={`${classNames} ${textStyles} disabled:cursor-not-allowed font-medium rounded-lg border-2 focus:outline-none focus:ring-4 focus:ring-indigo-200`}
    >
      {children}
    </button>
  );
};

export { Button };

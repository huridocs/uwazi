import React from 'react';

interface ButtonProps {
  children: string | React.ReactNode;
  type?: 'primary' | 'secondary' | 'tertiary';
  onClickFuntion?: () => any;
}

const Button = ({ children, type = 'primary', onClickFuntion }: ButtonProps) => {
  let classNames;

  switch (type) {
    case 'secondary':
      classNames =
        'text-primary-700 bg-white border-primary-700 hover:bg-primary-800 hover:text-white hover:border-primary-800';
      break;

    case 'tertiary':
      classNames = 'text-gray-700 bg-white border-gray-200 hover:text-primary-700';
      break;

    default:
      classNames =
        'text-white bg-primary-700 border-primary-700 hover:bg-primary-800 hover:border-primary-800';
      break;
  }

  return (
    <button
      type="button"
      onClick={onClickFuntion}
      className={`${classNames} font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 border-2 focus:outline-none focus:ring-4 focus:ring-indigo-200`}
    >
      {children}
    </button>
  );
};

export { Button };

/* eslint-disable react/no-multi-comp */
import React, { MouseEventHandler } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

type modalSizeType = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
interface ModalProps {
  children: string | React.ReactNode;
  size: modalSizeType;
}

const Modal = ({ children, size }: ModalProps) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    xxl: 'max-w-2xl',
    xxxl: 'max-w-3xl',
  };

  return (
    <div
      aria-hidden="false"
      className={`fixed top-0 right-0 left-0 z-50 h-modal overflow-y-auto overflow-x-hidden 
        md:inset-0 md:h-full items-center justify-center flex bg-gray-900 bg-opacity-50`}
      data-testid="modal"
      role="dialog"
      aria-label="Modal"
    >
      <div className={`relative h-full w-full p-4 md:h-auto ${sizes[size]}`}>
        <div className="relative bg-white rounded-lg shadow">{children}</div>
      </div>
    </div>
  );
};

interface ModalChildrenProps {
  children?: string | React.ReactNode;
  className?: string;
}

Modal.Header = ({ children, className }: ModalChildrenProps) => (
  <div
    className={`${className} flex items-start justify-between rounded-t ${
      children ? 'border-b p-5' : 'p-2'
    }`}
  >
    {children}
  </div>
);

Modal.Body = ({ children, className }: ModalChildrenProps) => (
  <div className={`${className} p-6 `} data-testid="modal-body">
    {children}
  </div>
);

Modal.Footer = ({ children }: ModalChildrenProps) => (
  <div className="flex justify-center p-6 space-x-2 border-t border-gray-200 rounded-b">
    {children}
  </div>
);

Modal.CloseButton = ({
  className,
  onClick,
}: ModalChildrenProps & { onClick?: MouseEventHandler }) => (
  <button
    onClick={onClick}
    aria-label="Close modal"
    className={`${className} ml-auto inline-flex items-center rounded-lg bg-transparent 
    p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 `}
    type="button"
  >
    <XMarkIcon className="w-4" />
  </button>
);

export type { ModalProps, modalSizeType };
export { Modal };

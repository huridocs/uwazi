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
    md: 'max-w-md min-w-[24rem]',
    lg: 'max-w-lg min-w-[28rem]',
    xl: 'max-w-xl min-w-[32rem]',
    xxl: 'max-w-2xl min-w-[36rem]',
    xxxl: 'max-w-3xl min-w-[40rem]',
  };

  return (
    <div
      aria-hidden="false"
      className="fixed inset-0 top-0 left-0 z-50 flex items-center justify-center overflow-x-hidden bg-gray-900 bg-opacity-50"
      data-testid="modal"
      role="dialog"
      aria-label="Modal"
    >
      <div className={`max-h-screen ${sizes[size]}`}>
        <div className="bg-white rounded-lg shadow">{children}</div>
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
      children ? 'p-5 border-b' : 'p-2'
    }`}
  >
    {children}
  </div>
);

Modal.Body = ({ children, className }: ModalChildrenProps) => (
  <div
    className={`overflow-y-auto p-6 h-full md:max-h-[70vh] ${className}`}
    data-testid="modal-body"
  >
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

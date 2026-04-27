/* eslint-disable react/no-multi-comp */
import React, { MouseEventHandler } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

type modalSizeType = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';

const modalBackdropClass = [
  'fixed inset-0 top-0 left-0 z-[100] flex items-center justify-center',
  'overflow-y-auto overflow-x-hidden p-3 sm:p-4',
  '[background-color:color-mix(in_srgb,var(--color-theme-surface-overlay,var(--color-theme-bg-overlay))_65%,transparent)]',
].join(' ');

const modalBorderClass =
  '[border-color:color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)]';

const modalSurfaceClass =
  '[background-color:var(--color-theme-surface-raised,var(--color-theme-bg-surface))]';

interface ModalProps {
  children: string | React.ReactNode;
  size: modalSizeType;
  id?: string;
}

const Modal = ({ children, size, id }: ModalProps) => {
  const sizes = {
    sm: 'w-full max-w-sm min-w-0',
    md: 'w-full max-w-md min-w-0 sm:min-w-[24rem]',
    lg: 'w-full max-w-lg min-w-0 sm:min-w-md',
    xl: 'w-full max-w-xl min-w-0 sm:min-w-lg',
    xxl: 'w-full max-w-2xl min-w-0 sm:min-w-xl',
    xxxl: 'w-full max-w-3xl min-w-0 sm:min-w-160',
  };

  return (
    <div
      aria-hidden="false"
      className={modalBackdropClass}
      data-testid="modal"
      role="dialog"
      aria-label="Modal"
      id={id}
    >
      <div className={`mx-auto max-h-[min(100dvh,100vh)] min-h-0 w-full ${sizes[size]}`}>
        <div
          className={`min-w-0 rounded-lg shadow-sm ${modalSurfaceClass} [color:var(--color-theme-text-primary)]`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

interface ModalChildrenProps {
  children?: string | React.ReactNode;
  className?: string;
}

const modalHeaderShell =
  'flex min-w-0 items-start justify-between gap-3 rounded-t [&>*:first-child]:min-w-0 [&>*:first-child]:shrink [&>*:first-child]:pr-1';

Modal.Header = ({ children, className }: ModalChildrenProps) => (
  <div
    className={`${className} ${modalHeaderShell} ${
      children ? 'border-b p-5' : 'p-2'
    } ${modalBorderClass}`}
  >
    {children}
  </div>
);

Modal.Body = ({ children, className }: ModalChildrenProps) => (
  <div
    className={`h-full overflow-y-auto p-6 md:max-h-[70vh] ${modalSurfaceClass} ${className}`}
    data-testid="modal-body"
  >
    {children}
  </div>
);

Modal.Footer = ({ children, className }: ModalChildrenProps) => (
  <div
    className={
      className
        ? `rounded-b border-t p-6 ${modalBorderClass} ${modalSurfaceClass} ${className}`
        : `flex justify-end gap-x-2 rounded-b border-t p-6 ${modalBorderClass} ${modalSurfaceClass}`
    }
  >
    {children}
  </div>
);

Modal.CloseButton = ({
  className,
  onClick,
  disabled,
  children,
}: ModalChildrenProps & {
  onClick?: MouseEventHandler;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    aria-label="Close modal"
    className={[
      className,
      'ml-auto inline-flex shrink-0 items-center rounded-lg bg-transparent p-1.5 text-sm',
      '[color:var(--color-theme-text-muted)]',
      'enabled:hover:[background-color:var(--color-theme-surface-muted)]',
      'disabled:hover:bg-transparent',
    ].join(' ')}
    type="button"
    disabled={disabled}
  >
    {children ? (
      <span className="inline-flex items-center gap-1.5">
        <XMarkIcon className="w-4 shrink-0" />
        {children}
      </span>
    ) : (
      <XMarkIcon className="w-4" />
    )}
  </button>
);

export type { ModalProps, modalSizeType };
export { Modal };

import React from 'react';
import { Popover } from '@headlessui/react';
import { Translate } from '#app/I18N/index.js';

type DeleteConfirmationProps = {
  onConfirm: () => void;
  onCancel?: () => void;
  triggerButton: React.ReactElement;
};

export const DeleteConfirmation = ({
  onConfirm,
  onCancel,
  triggerButton,
}: DeleteConfirmationProps) => (
  <Popover className="relative h-[20px]">
    {({ open, close }) => (
      <>
        <Popover.Button
          as="div"
          className="inline-flex items-center h-fit leading-none"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
          }}
        >
          {triggerButton}
        </Popover.Button>
        {open && (
          <Popover.Panel
            static
            className="absolute right-full top-1/2 -translate-y-1/2 z-[100] flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm border border-gray-200 whitespace-nowrap"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-xs font-medium text-gray-900">
              <Translate>Delete?</Translate>
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onConfirm();
                close();
              }}
              className="rounded bg-error-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Translate>Yes</Translate>
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onCancel?.();
                close();
              }}
              className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Translate>No</Translate>
            </button>
          </Popover.Panel>
        )}
      </>
    )}
  </Popover>
);

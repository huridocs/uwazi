import React from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';

type DeleteConfirmationProps = {
  onConfirm: () => void;
  onCancel?: () => void;
  triggerButton: React.ReactElement<any>;
};

export const DeleteConfirmation = ({
  onConfirm,
  onCancel,
  triggerButton,
}: DeleteConfirmationProps) => (
  <Popover className="relative h-5">
    {({ open, close }) => (
      <>
        <PopoverButton
          as="div"
          className="inline-flex items-center h-fit leading-none"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
          }}
        >
          {triggerButton}
        </PopoverButton>
        {open && (
          <PopoverPanel
            static
            className="absolute right-full top-1/2 -translate-y-1/2 z-100 flex items-center gap-2 rounded-lg border border-border bg-paper p-2 whitespace-nowrap shadow-sm"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-xs font-medium text-ink">
              <Translate>Delete?</Translate>
            </span>
            <Button
              variant="danger"
              size="small"
              onClick={e => {
                e.stopPropagation();
                onConfirm();
                close();
              }}
            >
              <Translate>Yes</Translate>
            </Button>
            <Button
              variant="warm"
              size="small"
              onClick={e => {
                e.stopPropagation();
                onCancel?.();
                close();
              }}
            >
              <Translate>No</Translate>
            </Button>
          </PopoverPanel>
        )}
      </>
    )}
  </Popover>
);

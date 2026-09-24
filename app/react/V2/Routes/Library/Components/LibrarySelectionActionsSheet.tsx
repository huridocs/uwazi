import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Translate } from '#app/I18N/index.js';
import type { LibraryBulkAction, LibrarySelectionAction } from './librarySelectionActions.js';

type LibrarySelectionActionsSheetProps = {
  count: number;
  actions: LibrarySelectionAction[];
  onClose: () => void;
  onAction?: (action: LibraryBulkAction) => void;
};

const LibrarySelectionActionsSheet = ({
  count,
  actions,
  onClose,
  onAction,
}: LibrarySelectionActionsSheetProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div data-component="SelectionActionsSheet" className="fixed inset-0 z-50 flex items-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-ink/20"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Actions for ${count} selected`}
        className="relative w-full rounded-t-lg border-t border-border bg-paper p-2 pb-4 shadow-lg"
      >
        <p className="px-3 py-2 text-meta text-ink-tertiary tabular-nums">
          {count.toLocaleString()} <Translate>selected</Translate>
        </p>
        <ul className="flex flex-col">
          {actions.map(action => (
            <li key={action.id}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAction?.(action.id);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-start text-sm text-ink hover:bg-warm"
              >
                <span className="text-ink-tertiary" aria-hidden>
                  {action.icon}
                </span>
                <span className={`flex-1 ${action.danger ? 'text-seal-label' : ''}`}>
                  <Translate>{action.label}</Translate>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
};

export type { LibrarySelectionActionsSheetProps };
export { LibrarySelectionActionsSheet };

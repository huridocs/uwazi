import React from 'react';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';
import { LibraryFooterTrail, type LibraryFooterTrailProps } from './LibraryFooterTrail.js';
import { LibrarySelectionActionsMenu } from './LibrarySelectionActionsMenu.js';
import { LibrarySelectionDelete } from './LibrarySelectionDelete.js';
import { LibrarySelectionLeadActions } from './LibrarySelectionLeadActions.js';

type LibraryMultiSelectFooterProps = {
  count: number;
  onClear: () => void;
  onAction?: (action: LibraryBulkAction) => void;
} & LibraryFooterTrailProps;

const LibraryMultiSelectFooter = ({
  count,
  onClear,
  onAction,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  showPagination,
  pageCount,
  onSelectPage,
}: LibraryMultiSelectFooterProps) => {
  const compact = useIsMobile() === true;
  return (
    <div data-testid="library-multi-select-footer" className="w-full shrink-0">
      <div
        className="flex h-12 items-center gap-2 overflow-hidden bg-paper px-3"
        style={{ borderTop: '1px solid var(--border-primary)' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          <div data-testid="library-multi-select-actions" className="flex shrink-0 items-center">
            <LibrarySelectionLeadActions onAction={onAction} />
            <LibrarySelectionActionsMenu onAction={onAction} />
            <LibrarySelectionDelete count={count} onAction={onAction} />
          </div>
        </div>
        <LibraryFooterTrail
          pin
          selectedCount={count}
          onClear={onClear}
          compact={compact}
          page={page}
          limit={limit}
          total={total}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          showPagination={showPagination}
          pageCount={pageCount}
          onSelectPage={onSelectPage}
        />
      </div>
    </div>
  );
};

export type { LibraryMultiSelectFooterProps };
export { LibraryMultiSelectFooter };

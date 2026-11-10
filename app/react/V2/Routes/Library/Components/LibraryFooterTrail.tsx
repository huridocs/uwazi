import React from 'react';
import { LibraryPagination } from './LibraryPagination.js';
import { LibrarySelectMenu } from './LibrarySelectMenu.js';

type LibraryFooterTrailProps = {
  pageCount?: number;
  selectedCount?: number;
  onSelectPage?: () => void;
  onClear?: () => void;
  showPagination?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  compact?: boolean;
  pin?: boolean;
};

const LibraryFooterTrail = ({
  pageCount = 0,
  selectedCount = 0,
  onSelectPage,
  onClear,
  showPagination = true,
  page = 1,
  limit = 30,
  total = 0,
  onPageChange = () => undefined,
  onLimitChange = () => undefined,
  compact = false,
  pin = false,
}: LibraryFooterTrailProps) => (
  <div
    data-testid="library-footer-trail"
    className={
      pin ? 'ms-auto flex shrink-0 items-center gap-2' : 'flex shrink-0 items-center gap-2'
    }
  >
    <LibrarySelectMenu
      pageCount={pageCount}
      selectedCount={selectedCount}
      onSelectPage={onSelectPage}
      onClear={onClear}
      withTrigger
    />
    {showPagination ? (
      <LibraryPagination
        compact={compact}
        page={page}
        limit={limit}
        total={total}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    ) : null}
  </div>
);

export type { LibraryFooterTrailProps };
export { LibraryFooterTrail };

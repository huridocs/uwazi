import React, { useId, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { LibraryFooterMenu } from './LibraryFooterMenu.js';

const LIBRARY_PAGE_SIZES = [30, 60, 120];

const stepClassName =
  'inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-warm hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent';

type LibraryPaginationProps = {
  page: number;
  limit: number;
  total: number;
  compact?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

const pageStats = (page: number, limit: number, total: number) => {
  const size = Math.max(limit, 1);
  const pages = Math.max(1, Math.ceil(total / size));
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = total === 0 ? 0 : Math.min(page * size, total);
  return { pages, start, end };
};

const formatCount = (value: number, locale: string) => value.toLocaleString(locale);

const LibraryPagination = ({
  page,
  limit,
  total,
  compact = false,
  onPageChange,
  onLimitChange,
}: LibraryPaginationProps) => {
  const locale = useAtomValue(localeAtom) || 'en';
  const { pages, start, end } = pageStats(page, limit, total);
  const sizeRef = useRef<HTMLButtonElement>(null);
  const [sizeOpen, setSizeOpen] = useState(false);
  const menuId = useId();
  const perPage = t('System', 'per page', null, false);

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs text-ink-secondary">
      {compact ? null : (
        <p className="flex items-center gap-1.5">
          <span className="tabular-nums text-ink">
            {formatCount(start, locale)}-{formatCount(end, locale)}
          </span>
          <Translate>of</Translate>
          <span className="tabular-nums text-ink">{formatCount(total, locale)}</span>
          <span aria-hidden className="text-ink-muted">
            ·
          </span>
          <button
            ref={sizeRef}
            type="button"
            className="inline-flex cursor-pointer items-center gap-0.5 rounded-md px-1 py-0.5 text-ink-secondary hover:bg-warm hover:text-ink"
            aria-haspopup="menu"
            aria-expanded={sizeOpen}
            aria-controls={menuId}
            onClick={() => setSizeOpen(open => !open)}
          >
            <span className="tabular-nums">{limit}</span> {perPage}
            <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden />
          </button>
          <LibraryFooterMenu
            open={sizeOpen}
            onClose={() => setSizeOpen(false)}
            anchorRef={sizeRef}
            label={perPage}
            menuId={menuId}
            prefer="end"
          >
            {LIBRARY_PAGE_SIZES.map(size => (
              <button
                key={size}
                type="button"
                role="menuitem"
                className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-xs text-ink-secondary hover:bg-warm hover:text-ink"
                onClick={() => {
                  setSizeOpen(false);
                  onLimitChange(size);
                }}
              >
                <span className="tabular-nums">{size}</span> {perPage}
              </button>
            ))}
          </LibraryFooterMenu>
        </p>
      )}
      <nav
        aria-label={t('System', 'Pagination', null, false)}
        className="flex items-center gap-0.5"
      >
        <button
          type="button"
          className={stepClassName}
          aria-label={t('System', 'Previous', null, false)}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        </button>
        <span className="min-w-14 px-1 text-center tabular-nums text-ink">
          {page} / {pages}
        </span>
        <button
          type="button"
          className={stepClassName}
          aria-label={t('System', 'Next', null, false)}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
};

export type { LibraryPaginationProps };
export { LibraryPagination, LIBRARY_PAGE_SIZES };

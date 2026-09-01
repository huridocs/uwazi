import React from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { DEFAULT_LIBRARY_URL_STATE } from '../libraryUrlState.js';

type LoadMoreProps = {
  loaded: number;
  total: number;
  onLoadMore: (amount: number) => void;
};

const LoadMore = ({ loaded, total, onLoadMore }: LoadMoreProps) => {
  const locale = useAtomValue(localeAtom) || 'en';
  const remaining = total - loaded;

  if (remaining <= 0) {
    return null;
  }

  const remainingLabel = remaining.toLocaleString(locale);

  return (
    <div className="flex justify-center pt-4">
      <button
        type="button"
        onClick={() => onLoadMore(DEFAULT_LIBRARY_URL_STATE.limit)}
        className="cursor-pointer rounded-md bg-warm px-4 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
      >
        <Translate>Show more</Translate>
        {` — ${remainingLabel} `}
        <Translate>remaining</Translate>
      </button>
    </div>
  );
};

export type { LoadMoreProps };
export { LoadMore };

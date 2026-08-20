import React from 'react';
import { Translate } from '#app/I18N/index.js';

type LoadMoreProps = {
  loaded: number;
  total: number;
  onLoadMore: (amount: number) => void;
};

const LoadMore = ({ loaded, total, onLoadMore }: LoadMoreProps) => {
  if (loaded >= total) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {[30, 300].map(amount => (
        <button
          key={amount}
          type="button"
          onClick={() => onLoadMore(amount)}
          className="cursor-pointer rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
        >
          {amount} <Translate>x more</Translate>
        </button>
      ))}
    </div>
  );
};

export type { LoadMoreProps };
export { LoadMore };

import React from 'react';
import { Translate } from '#app/I18N/index.js';

type PageTagProps = {
  page: number;
  onClick?: () => void;
};

const PageTag = ({ page, onClick }: PageTagProps) => (
  <button
    type="button"
    onClick={e => {
      e.stopPropagation();
      onClick?.();
    }}
    className="inline-flex cursor-pointer items-center rounded bg-vellum px-1.5 py-0.5 font-mono text-xs text-ink-secondary transition-colors hover:bg-border hover:text-ink"
  >
    <Translate>p.</Translate>
    {page}
  </button>
);

export { PageTag };

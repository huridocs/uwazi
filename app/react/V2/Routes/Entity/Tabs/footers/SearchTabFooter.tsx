import React, { useRef, useState } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { Translate, t } from '#app/I18N/index.js';
import { AnchoredPortal } from '#V2/Components/UI/AnchoredPortal.js';
import { SearchTipsContent } from '#V2/Routes/Entity/Components/search/index.js';
import { useUpdateEntityUrl } from '../../entityUrlState.js';
import { SEARCH_PARAM } from '../../urlParams.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const SearchTabFooter = () => {
  const updateEntityUrl = useUpdateEntityUrl();
  const tipRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const tipsLabel = t('System', 'Search tips', null, false);

  const onInsert = (example: string) => {
    updateEntityUrl({
      hash: next => {
        next.set(SEARCH_PARAM, example);
      },
    });
    setOpen(false);
  };

  return (
    <EntityTabFooter inset="side">
      <div className="flex w-full items-center justify-end">
        <div className="relative">
          <button
            ref={tipRef}
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-label={tipsLabel}
            className="inline-flex h-5 shrink-0 cursor-pointer items-center gap-1 rounded bg-warm px-1.5 text-nano font-medium text-ink-tertiary transition-colors hover:bg-parchment hover:text-ink-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink/20"
          >
            <LightBulbIcon className="h-2.5 w-2.5" aria-hidden="true" />
            <Translate>tips</Translate>
          </button>
          <AnchoredPortal
            open={open}
            anchorRef={tipRef}
            prefer="end"
            width={432}
            onClose={() => setOpen(false)}
            className="rounded-lg border border-border bg-paper p-2 shadow-lg"
          >
            <div role="dialog" aria-label={tipsLabel}>
              <SearchTipsContent onInsert={onInsert} />
            </div>
          </AnchoredPortal>
        </div>
      </div>
    </EntityTabFooter>
  );
};

export { SearchTabFooter };

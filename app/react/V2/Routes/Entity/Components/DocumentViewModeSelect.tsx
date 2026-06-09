import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useSearchParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { isClient } from '#app/utils/index.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../urlParams.js';
import { pdfController } from './atoms.js';

const DocumentViewModeSelect = () => {
  const renderModeSelectId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const pdfControls = useAtomValue(pdfController);
  const [hydrated, setHydrated] = useState(false);
  const initialPage = useRef(Number.parseInt(searchParams.get(PAGE_PARAM) || '1', 10));

  useEffect(() => {
    setHydrated(true);
  }, []);

  const isRaw = !isClient || !hydrated || searchParams.get(VIEW_MODE_PARAM) === 'true';

  const onDisplayModeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      const next = new URLSearchParams(searchParams.toString());
      const currentPage = searchParams.get(PAGE_PARAM) || '1';
      if (value === 'raw') {
        next.set(VIEW_MODE_PARAM, 'true');
      } else {
        next.delete(VIEW_MODE_PARAM);
        next.set(PAGE_PARAM, currentPage);
      }
      initialPage.current = Number(currentPage);
      pdfControls?.goToPage(Number(currentPage));
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [pdfControls, searchParams, setSearchParams]
  );

  return (
    <div className="relative inline-flex shrink-0 items-center">
      <label htmlFor={renderModeSelectId} className="sr-only">
        <Translate>View</Translate>
      </label>
      <select
        id={renderModeSelectId}
        className={`appearance-none rounded-md border bg-warm py-1 pl-2 text-xs font-medium text-ink transition-colors hover:bg-parchment focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)] ${isRaw ? 'pr-6 min-w-[6.25rem]' : 'pr-6 w-[4.25rem]'}`}
        value={isRaw ? 'raw' : 'normal'}
        onChange={onDisplayModeChange}
      >
        <option value="raw">{t('System', 'Plain text', null, false)}</option>
        <option value="normal">{t('System', 'PDF', null, false)}</option>
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-secondary"
        aria-hidden
      />
    </div>
  );
};

export { DocumentViewModeSelect };

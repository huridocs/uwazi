import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Bars3BottomLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { isClient } from '#app/utils/index.js';
import { useEntityHashParams, useUpdateEntityUrl } from '../../entityUrlState.js';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../../urlParams.js';
import { useDocumentPdf } from '#V2/Routes/Entity/Components/context/index.js';

type ViewMode = 'raw' | 'normal';

const DocumentViewModeSelect = () => {
  const updateEntityUrl = useUpdateEntityUrl();
  const { pdfController: pdfControls } = useDocumentPdf();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const hashParams = useEntityHashParams();
  const initialPage = useRef(Number.parseInt(hashParams.get(PAGE_PARAM) || '1', 10));

  useEffect(() => {
    setReady(true);
  }, []);

  const isRaw = !isClient || !ready || hashParams.get(VIEW_MODE_PARAM) === 'true';

  const selectMode = useCallback(
    (value: ViewMode) => {
      const currentPage = hashParams.get(PAGE_PARAM) || '1';
      updateEntityUrl({
        search: next => {
          next.delete(VIEW_MODE_PARAM);
        },
        hash: next => {
          if (value === 'raw') {
            next.set(VIEW_MODE_PARAM, 'true');
          } else {
            next.delete(VIEW_MODE_PARAM);
          }
        },
      });
      initialPage.current = Number(currentPage);
      if (value !== 'raw') {
        pdfControls?.goToPage(Number(currentPage));
      }
      setOpen(false);
    },
    [pdfControls, hashParams, updateEntityUrl]
  );

  const modes = [
    { id: 'normal' as const, label: t('System', 'PDF', null, false), Icon: DocumentTextIcon },
    {
      id: 'raw' as const,
      label: t('System', 'Plain text', null, false),
      Icon: Bars3BottomLeftIcon,
    },
  ];
  const activeMode = isRaw ? modes[1] : modes[0];
  const ActiveIcon = activeMode.Icon;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('System', 'View', null, false)}
        className="flex cursor-pointer items-center gap-1.5 rounded-md bg-warm px-2 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment"
      >
        <ActiveIcon className="size-3.5 text-ink-tertiary" aria-hidden />
        {activeMode.label}
        <ChevronDownIcon
          className={`size-3.5 text-ink-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1 min-w-40 overflow-hidden rounded-md border border-border bg-paper py-1 shadow-xl"
          >
            {modes.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => selectMode(id)}
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  activeMode.id === id
                    ? 'bg-vellum font-semibold text-ink'
                    : 'text-ink-secondary hover:bg-warm'
                }`}
              >
                <Icon className="size-3.5 shrink-0 text-ink-tertiary" aria-hidden />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { DocumentViewModeSelect };

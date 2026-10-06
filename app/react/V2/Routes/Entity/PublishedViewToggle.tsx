import React, { useLayoutEffect, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { t } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/index.js';
import { mergeTabGroup, tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import { sheetStackAtom } from '#V2/Components/Layouts/PaneLayout/sheetStack.js';
import {
  useEntityOverlayTarget,
  useEntityPageView,
  useMetadataEditing,
} from './Components/index.js';
import { useUpdateEntityUrl } from './entityUrlState.js';
import { entityDisplayModeAtom } from './entityDisplayModeAtom.js';
import { MAIN_TAB } from './Tabs/tabIds.js';
import { MAIN_TAB_PARAM } from './urlParams.js';

const useModalOpen = (active: boolean) => {
  const [modalOpen, setModalOpen] = useState(false);

  useLayoutEffect(() => {
    if (!active) return undefined;
    const sync = () => {
      setModalOpen(document.querySelector('[data-testid="modal"]') !== null);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [active]);

  return modalOpen;
};

const usePublishedViewActions = () => {
  const mode = useAtomValue(entityDisplayModeAtom);
  const setMode = useSetAtom(entityDisplayModeAtom);
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const updateEntityUrl = useUpdateEntityUrl();
  const { isEditing, isDirty, requestDiscard } = useMetadataEditing();

  const activate = () => {
    const showPublished = () => {
      updateEntityUrl({
        search: params => {
          params.delete(MAIN_TAB_PARAM);
        },
      });
      setMode('published');
    };
    if (mode === 'published') {
      setTabGroups(prev => mergeTabGroup(prev, 'entity-main', { activeTabId: MAIN_TAB.METADATA }));
      updateEntityUrl({
        search: params => {
          params.set(MAIN_TAB_PARAM, MAIN_TAB.METADATA);
        },
      });
      setMode('entity');
      return;
    }
    if (isEditing && isDirty) {
      requestDiscard('discard', showPublished);
      return;
    }
    showPublished();
  };

  return { toEntity: mode === 'published', activate };
};

const PublishedViewToggle = () => {
  const { hasEntityPageView } = useEntityPageView();
  const { toEntity, activate } = usePublishedViewActions();
  const { target } = useEntityOverlayTarget();
  const sheets = useAtomValue(sheetStackAtom);
  const modalOpen = useModalOpen(hasEntityPageView);

  if (!hasEntityPageView) return null;

  const label = toEntity
    ? t('System', 'Entity view', null, false)
    : t('System', 'Published view', null, false);

  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        onClick={activate}
        className={[
          'fixed z-30 top-16.25 inset-e-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md',
          'bg-warm text-ink-secondary transition-colors hover:bg-parchment hover:text-ink',
          'inset-ring inset-ring-(--color-theme-border-soft)',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-theme-control-ring)',
          target !== null || sheets.length > 0 || modalOpen ? 'invisible' : '',
        ].join(' ')}
      >
        {toEntity ? (
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
            className="rtl:-scale-x-100"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M15 3v18" />
          </svg>
        ) : (
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
            className="rtl:-scale-x-100"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M10 6h8v4h-8z" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
          </svg>
        )}
      </button>
    </Tooltip>
  );
};

export { PublishedViewToggle };

import { useEffect } from 'react';
import type { UpdateEntityUrlOptions } from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import type { TabButtonDef } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import {
  MAIN_TAB,
  SIDE_TAB,
  isValidMainTab,
  isValidSideTab,
  type MainTabId,
  type SideTabId,
} from '../tabIds.js';
import { isFilesCompanion } from '../paneTabSelection.js';

type UseEntityTabUrlSanitizeParams = {
  hashParams: URLSearchParams;
  searchParams: URLSearchParams;
  activeMainTab: SideTabId;
  sideButtons: TabButtonDef[];
  mainTabIds: Set<MainTabId>;
  hasMainDocument: boolean;
  suspend: boolean;
  updateEntityUrl: (options: UpdateEntityUrlOptions) => void;
};

const sanitizeMainParam = ({
  raw,
  hasMainDocument,
  mainTabIds,
  updateEntityUrl,
}: {
  raw: string | null;
  hasMainDocument: boolean;
  mainTabIds: Set<MainTabId>;
  updateEntityUrl: (options: UpdateEntityUrlOptions) => void;
}) => {
  if (!raw) return;
  if (isFilesCompanion(raw)) {
    updateEntityUrl({
      search: next => {
        next.set(MAIN_TAB_PARAM, SIDE_TAB.FILES);
      },
    });
    return;
  }
  if (isValidSideTab(raw) && (raw !== MAIN_TAB.DOCUMENT || hasMainDocument)) return;
  if (isValidMainTab(raw) && mainTabIds.has(raw)) return;
  updateEntityUrl({
    search: next => {
      next.delete(MAIN_TAB_PARAM);
    },
  });
};

const useEntityTabUrlSanitize = ({
  hashParams,
  searchParams,
  activeMainTab,
  sideButtons,
  mainTabIds,
  hasMainDocument,
  suspend,
  updateEntityUrl,
}: UseEntityTabUrlSanitizeParams) => {
  useEffect(() => {
    if (suspend) return;
    const raw = hashParams.get(SIDE_TAB_PARAM);
    if (!raw || !isValidSideTab(raw)) return;
    if (raw === activeMainTab || !sideButtons.some(button => button.id === raw)) {
      updateEntityUrl({
        hash: next => {
          next.delete(SIDE_TAB_PARAM);
        },
      });
    }
  }, [hashParams, activeMainTab, sideButtons, suspend, updateEntityUrl]);

  useEffect(() => {
    if (suspend) return;
    sanitizeMainParam({
      raw: searchParams.get(MAIN_TAB_PARAM),
      hasMainDocument,
      mainTabIds,
      updateEntityUrl,
    });
  }, [hasMainDocument, mainTabIds, searchParams, suspend, updateEntityUrl]);
};

export { useEntityTabUrlSanitize };

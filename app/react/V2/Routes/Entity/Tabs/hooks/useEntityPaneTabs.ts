import { useCallback, useEffect, useMemo, useRef } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { mergeTabGroup, tabGroupsAtom } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import {
  useEntityHashUiParams,
  useEntitySearchParams,
  useUpdateEntityUrl,
} from '../../entityUrlState.js';
import { MAIN_TAB_PARAM, SEARCH_PARAM, SIDE_TAB_PARAM } from '../../urlParams.js';
import {
  applyMainTabSearchParam,
  paneChoiceAtom,
  pendingLeftTabAtom,
  pendingSideTabAtom,
} from '../entityTabState.js';
import {
  applyPaneChoice,
  resolvePaneTabs,
  searchHitPanes,
  selectPaneTab,
  type PaneTabAvailability,
  type PaneTabs,
} from '../paneTabSelection.js';
import { SIDE_TAB, type MainTabId, type SideTabId } from '../tabIds.js';
import { pickTabButtons } from '../sideTabSets.js';
import type { UseEntityTabsParams } from '../EntityTabsContext.js';
import { useEntitySideButtonModel } from './useEntitySideButtonModel.js';

const useStoredPane = () => {
  const [pendingLeft, setPendingLeft] = useAtom(pendingLeftTabAtom);
  const [pendingSide, setPendingSide] = useAtom(pendingSideTabAtom);
  const [choice, setChoice] = useAtom(paneChoiceAtom);
  return {
    pendingLeft,
    setPendingLeft,
    pendingSide,
    setPendingSide,
    choice,
    setChoice,
  };
};

type StoredPane = ReturnType<typeof useStoredPane>;

const trackedPaneUrlAtom = atom<{ left: string; side: string | null } | null>(null);

const usePaneButtons = (params: UseEntityTabsParams, panes: PaneTabs, searchDirty: boolean) => {
  const { catalogFor } = useEntitySideButtonModel(params);
  return useMemo(() => {
    const catalog = catalogFor(searchDirty);
    return {
      leftButtons: pickTabButtons(catalog, panes.leftIds),
      rightButtons: pickTabButtons(catalog, panes.rightIds),
    };
  }, [catalogFor, panes.leftIds, panes.rightIds, searchDirty]);
};

const pendingForUrl = (
  pending: SideTabId | null,
  current: string | null,
  tracked: string | null | undefined
): SideTabId | null => {
  if (!pending || tracked === undefined || pending === current || tracked !== current) return null;
  return pending;
};

const useVisiblePending = (urlLeft: SideTabId, hashParams: URLSearchParams, stored: StoredPane) => {
  const [tracked, setTracked] = useAtom(trackedPaneUrlAtom);
  const side = hashParams.get(SIDE_TAB_PARAM);
  const left = pendingForUrl(
    stored.pendingLeft,
    urlLeft,
    tracked === null ? undefined : tracked.left
  );
  const right = pendingForUrl(
    stored.pendingSide,
    side,
    tracked === null ? undefined : tracked.side
  );
  if (stored.pendingLeft !== left) stored.setPendingLeft(left);
  else if (stored.pendingSide !== right) stored.setPendingSide(right);
  else if (!tracked || tracked.left !== urlLeft || tracked.side !== side) {
    setTracked({ left: urlLeft, side });
  }
  return { left, right };
};

const useResolvedEntityPanes = (params: UseEntityTabsParams) => {
  const searchParams = useEntitySearchParams();
  const hashParams = useEntityHashUiParams();
  const stored = useStoredPane();
  const availability = useMemo<PaneTabAvailability>(
    () => ({
      hasMainDocument: params.hasMainDocument,
      showTranslationsTab: Boolean(params.filesSideTabs?.showTranslationsTab),
      hasEntity: Boolean(params.entity),
    }),
    [params.entity, params.filesSideTabs?.showTranslationsTab, params.hasMainDocument]
  );
  const searchDirty = Boolean(hashParams.get(SEARCH_PARAM)?.trim());
  const urlLeft = useMemo(
    () =>
      resolvePaneTabs({
        left: searchParams.get(MAIN_TAB_PARAM),
        rightFromUrl: null,
        availability,
      }).left,
    [availability, searchParams]
  );
  const visiblePending = useVisiblePending(urlLeft, hashParams, stored);
  const panes = useMemo(() => {
    const resolved = resolvePaneTabs({
      left: visiblePending.left ?? searchParams.get(MAIN_TAB_PARAM),
      rightFromUrl: visiblePending.right ?? hashParams.get(SIDE_TAB_PARAM),
      availability,
    });
    return applyPaneChoice(resolved, stored.choice);
  }, [
    availability,
    hashParams,
    searchParams,
    stored.choice,
    visiblePending.left,
    visiblePending.right,
  ]);
  const buttons = usePaneButtons(params, panes, searchDirty);
  return {
    searchParams,
    hashParams,
    stored,
    availability,
    urlLeft,
    panes,
    visiblePending,
    ...buttons,
  };
};

const usePaneTabReset = (entityId: string, stored: StoredPane) => {
  const previousSharedId = useRef(entityId);
  const { setPendingLeft, setPendingSide, setChoice } = stored;
  useEffect(() => {
    if (previousSharedId.current === entityId) return;
    previousSharedId.current = entityId;
    setPendingLeft(null);
    setPendingSide(null);
    setChoice(null);
  }, [entityId, setChoice, setPendingLeft, setPendingSide]);
};

const usePaneTabCommit = (resolved: ReturnType<typeof useResolvedEntityPanes>) => {
  const updateEntityUrl = useUpdateEntityUrl();
  const setTabGroups = useSetAtom(tabGroupsAtom);
  const { panes, availability, urlLeft, hashParams, stored } = resolved;
  const { setPendingLeft, setPendingSide, setChoice } = stored;
  const publish = useCallback(
    (next: PaneTabs, patchHash?: (params: URLSearchParams) => void) => {
      setChoice({
        left: next.leftChosen,
        right: next.rightChosen,
        leftTab: next.left,
        rightTab: next.right,
      });
      if (next.left === panes.left && next.right === panes.right) {
        if (patchHash) updateEntityUrl({ hash: patchHash });
        return;
      }
      setPendingLeft(next.left === urlLeft ? null : next.left);
      setPendingSide(hashParams.get(SIDE_TAB_PARAM) === next.right ? null : next.right);
      setTabGroups(prev => {
        const withMain = mergeTabGroup(prev, 'entity-main', { activeTabId: next.left });
        return mergeTabGroup(withMain, 'entity-side', { activeTabId: next.right });
      });
      updateEntityUrl({
        search: params => applyMainTabSearchParam(params, next.left),
        hash: params => {
          params.set(SIDE_TAB_PARAM, next.right);
          patchHash?.(params);
        },
      });
    },
    [
      hashParams,
      panes.left,
      panes.right,
      setChoice,
      setPendingLeft,
      setPendingSide,
      setTabGroups,
      updateEntityUrl,
      urlLeft,
    ]
  );
  const commit = useCallback(
    (pane: 'left' | 'right', tabId: string) => {
      publish(selectPaneTab({ current: panes, pane, tabId, availability }));
    },
    [availability, panes, publish]
  );
  const openSearchHit = useCallback(
    (mainTab: MainTabId, options?: { hash?: (params: URLSearchParams) => void }) => {
      publish(searchHitPanes(mainTab, panes.left === SIDE_TAB.SEARCH, availability), options?.hash);
    },
    [availability, panes.left, publish]
  );
  return { commit, openSearchHit };
};

const useEntityPaneTabs = (params: UseEntityTabsParams) => {
  const resolved = useResolvedEntityPanes(params);
  usePaneTabReset(params.entity.sharedId, resolved.stored);
  const { commit, openSearchHit } = usePaneTabCommit(resolved);
  return {
    panes: resolved.panes,
    leftButtons: resolved.leftButtons,
    rightButtons: resolved.rightButtons,
    pendingLeft: resolved.visiblePending.left,
    pendingSide: resolved.visiblePending.right,
    setPendingSide: resolved.stored.setPendingSide,
    hashParams: resolved.hashParams,
    searchParams: resolved.searchParams,
    commit,
    openSearchHit,
  };
};

export { useEntityPaneTabs };

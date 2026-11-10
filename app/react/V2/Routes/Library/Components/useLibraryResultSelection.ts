import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addLibraryEntity,
  applyLibraryClusterClick,
  applyLibraryEntityClick,
  EMPTY_CLICK_MODIFIERS,
  selectionInView,
  type LibraryClickModifiers,
} from '../librarySelection.js';

type LibraryResultSelectionArgs = {
  orderedIds: readonly string[];
  selectedIds: readonly string[];
  onSelectedIdsChange: (ids: string[]) => void;
  allowRange: boolean;
};

/** When the page changes, drop selected records that are no longer on it.
 *  The first page is left alone: a record already open is not cleared before
 *  the reader has moved. A selection change on the same page is also left
 *  alone, so a record chosen before the list refreshes is not cleared early. */
const usePruneHiddenSelection = (
  pageIds: readonly string[],
  selectedIds: readonly string[],
  onSelectedIdsChange: (ids: string[]) => void
) => {
  const selectedRef = useRef(selectedIds);
  const notifyRef = useRef(onSelectedIdsChange);
  const pageIdsRef = useRef(pageIds);
  const firstPage = useRef(true);
  selectedRef.current = selectedIds;
  notifyRef.current = onSelectedIdsChange;
  pageIdsRef.current = pageIds;
  const visibleKey = pageIds.join('\0');

  useEffect(() => {
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    const { current } = selectedRef;
    const { current: visibleIds } = pageIdsRef;
    const { current: notify } = notifyRef;
    const next = selectionInView(current, visibleIds);
    const changed =
      next.length !== current.length || next.some((id, index) => id !== current[index]);
    if (changed) {
      notify(next);
    }
  }, [visibleKey]);
};

const useLibraryResultSelection = ({
  orderedIds,
  selectedIds,
  onSelectedIdsChange,
  allowRange,
}: LibraryResultSelectionArgs) => {
  const [anchorId, setAnchorId] = useState<string>();
  usePruneHiddenSelection(orderedIds, selectedIds, onSelectedIdsChange);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setAnchorId(undefined);
    }
  }, [selectedIds]);

  const selectEntity = useCallback(
    (sharedId: string, modifiers: LibraryClickModifiers = EMPTY_CLICK_MODIFIERS) => {
      const next = applyLibraryEntityClick({
        selection: { ids: [...selectedIds], anchorId },
        orderedIds,
        clickedId: sharedId,
        modifiers,
        allowRange,
      });
      setAnchorId(next.anchorId);
      onSelectedIdsChange(next.ids);
    },
    [allowRange, anchorId, onSelectedIdsChange, orderedIds, selectedIds]
  );

  const selectCluster = useCallback(
    (sharedIds: string[], modifiers: LibraryClickModifiers = EMPTY_CLICK_MODIFIERS) => {
      const next = applyLibraryClusterClick({
        selection: { ids: [...selectedIds], anchorId },
        clusterIds: sharedIds,
        modifiers,
      });
      setAnchorId(next.anchorId);
      onSelectedIdsChange(next.ids);
    },
    [anchorId, onSelectedIdsChange, selectedIds]
  );

  const addEntity = useCallback(
    (sharedId: string) => {
      const next = addLibraryEntity({ ids: [...selectedIds], anchorId }, sharedId);
      setAnchorId(next.anchorId);
      onSelectedIdsChange(next.ids);
    },
    [anchorId, onSelectedIdsChange, selectedIds]
  );

  const clear = useCallback(() => {
    setAnchorId(undefined);
    onSelectedIdsChange([]);
  }, [onSelectedIdsChange]);

  return { selectEntity, selectCluster, addEntity, clear };
};

export { useLibraryResultSelection, usePruneHiddenSelection };

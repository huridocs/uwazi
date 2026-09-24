import { useCallback, useEffect, useState } from 'react';
import {
  applyLibraryClusterClick,
  applyLibraryEntityClick,
  EMPTY_CLICK_MODIFIERS,
  type LibraryClickModifiers,
} from '../librarySelection.js';

type LibraryResultSelectionArgs = {
  orderedIds: readonly string[];
  selectedIds: readonly string[];
  onSelectedIdsChange: (ids: string[]) => void;
  allowRange: boolean;
};

const useLibraryResultSelection = ({
  orderedIds,
  selectedIds,
  onSelectedIdsChange,
  allowRange,
}: LibraryResultSelectionArgs) => {
  const [anchorId, setAnchorId] = useState<string>();

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

  const clear = useCallback(() => {
    setAnchorId(undefined);
    onSelectedIdsChange([]);
  }, [onSelectedIdsChange]);

  return { selectEntity, selectCluster, clear };
};

export { useLibraryResultSelection };

import { useState } from 'react';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryClickModifiers } from '../librarySelection.js';
import { useLibraryLeaveRequest } from './libraryPreviewLeave.js';
import { useLibraryLongPress } from './useLibraryLongPress.js';
import { useLibrarySelectionCommands } from './useLibrarySelectionCommands.js';

const useLibraryPreviewFocus = (
  onSelect: (sharedId: string, modifiers?: LibraryClickModifiers) => void,
  onClosePreview: () => void
) => {
  const [focusFieldKey, setFocusFieldKey] = useState<string>();
  return {
    focusFieldKey,
    clearFocus: () => setFocusFieldKey(undefined),
    selectRow: (sharedId: string, modifiers?: LibraryClickModifiers) => {
      setFocusFieldKey(undefined);
      onSelect(sharedId, modifiers);
    },
    selectProperty: (sharedId: string, fieldKey: string) => {
      setFocusFieldKey(fieldKey);
      onSelect(sharedId);
    },
    closePreview: () => {
      setFocusFieldKey(undefined);
      onClosePreview();
    },
  };
};

const useLibraryCreateActions = (
  onSelect: (sharedId: string, modifiers?: LibraryClickModifiers) => void,
  onClosePreview: () => void,
  onEntityCreated?: (sharedId?: string, row?: LibrarySearchHit) => void
) => {
  const requestLeave = useLibraryLeaveRequest();
  const [creating, setCreating] = useState(false);
  const preview = useLibraryPreviewFocus(
    (sharedId, modifiers) => {
      setCreating(false);
      onSelect(sharedId, modifiers);
    },
    () => {
      setCreating(false);
      onClosePreview();
    }
  );
  return {
    focusFieldKey: preview.focusFieldKey,
    beginSelection: () => {
      setCreating(false);
      preview.clearFocus();
    },
    creating,
    selectRow: (sharedId: string, modifiers?: LibraryClickModifiers) =>
      requestLeave(() => preview.selectRow(sharedId, modifiers)),
    selectProperty: (sharedId: string, fieldKey: string) =>
      requestLeave(() => preview.selectProperty(sharedId, fieldKey)),
    closePreview: (afterClose?: () => void) =>
      requestLeave(() => {
        preview.closePreview();
        afterClose?.();
      }),
    openCreate: () =>
      requestLeave(() => {
        preview.closePreview();
        setCreating(true);
      }),
    finishCreated: (sharedId?: string, row?: LibrarySearchHit) => {
      setCreating(false);
      onEntityCreated?.(sharedId, row);
      if (sharedId) preview.selectRow(sharedId);
    },
  };
};

type LibrarySelectionChromeArgs = {
  selectedIds: readonly string[];
  rows: readonly LibrarySearchHit[];
  addEntity: (sharedId: string) => void;
  onDeleted: (sharedIds: readonly string[]) => void;
};

const useLibrarySelectionChrome = ({
  selectedIds,
  rows,
  addEntity,
  onDeleted,
}: LibrarySelectionChromeArgs) => {
  useLibraryLongPress(addEntity);
  const commands = useLibrarySelectionCommands(selectedIds, rows, onDeleted);
  return { selectionPanelOpen: selectedIds.length > 1, ...commands };
};

export { useLibraryCreateActions, useLibrarySelectionChrome };

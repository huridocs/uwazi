import { useState } from 'react';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryClickModifiers } from '../librarySelection.js';
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
  onEntityCreated?: (sharedId?: string) => void
) => {
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
    ...preview,
    beginSelection: () => {
      setCreating(false);
      preview.clearFocus();
    },
    creating,
    openCreate: () => {
      preview.closePreview();
      setCreating(true);
    },
    finishCreated: (sharedId?: string) => {
      setCreating(false);
      onEntityCreated?.(sharedId);
      if (sharedId) {
        preview.selectRow(sharedId);
      }
    },
  };
};

const useLibrarySelectionPanel = (selectedIds: readonly string[]) => ({
  selectionPanelOpen: selectedIds.length > 1,
});

type LibrarySelectionChromeArgs = {
  selectedIds: readonly string[];
  rows: readonly LibrarySearchHit[];
  addEntity: (sharedId: string) => void;
  onDeleted: () => void;
};

const useLibrarySelectionChrome = ({
  selectedIds,
  rows,
  addEntity,
  onDeleted,
}: LibrarySelectionChromeArgs) => {
  const panel = useLibrarySelectionPanel(selectedIds);
  useLibraryLongPress(addEntity);
  const commands = useLibrarySelectionCommands(selectedIds, rows, onDeleted);
  return { ...panel, ...commands };
};

export { useLibraryCreateActions, useLibrarySelectionChrome, useLibrarySelectionPanel };

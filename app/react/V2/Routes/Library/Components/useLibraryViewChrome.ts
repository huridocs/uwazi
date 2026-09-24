import { useState } from 'react';
import type { LibraryClickModifiers } from '../librarySelection.js';

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

const useLibrarySelectionPanel = (
  selectedIds: readonly string[],
  orderedIds: readonly string[]
) => {
  const loaded = new Set(orderedIds);
  return {
    selectionPanelOpen: selectedIds.length > 1,
    notShown: selectedIds.filter(id => !loaded.has(id)).length,
  };
};

export { useLibraryCreateActions, useLibrarySelectionPanel };

import { useEffect, useState } from 'react';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryClickModifiers } from '../librarySelection.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';
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

const useLibrarySelectionPanel = (
  selectedIds: readonly string[],
  orderedIds: readonly string[]
) => {
  const loaded = new Set(orderedIds);
  return {
    selectionPanelOpen: selectedIds.length >= 1,
    notShown: selectedIds.filter(id => !loaded.has(id)).length,
  };
};

const useLibraryInspectCommands = (
  selectedIds: readonly string[],
  rows: readonly LibrarySearchHit[],
  onDeleted: () => void
) => {
  const [inspecting, setInspecting] = useState(false);
  const selectionKey = selectedIds.join('\u0000');
  const commands = useLibrarySelectionCommands(selectedIds, rows, onDeleted);
  useEffect(() => {
    setInspecting(false);
  }, [selectionKey]);
  const onAction = (action: LibraryBulkAction) => {
    if (action === 'edit' && selectedIds.length === 1) {
      setInspecting(true);
      return;
    }
    commands.onAction(action);
  };
  return { inspecting, onAction, dialogs: commands.dialogs };
};

type LibrarySelectionChromeArgs = {
  selectedIds: readonly string[];
  orderedIds: readonly string[];
  rows: readonly LibrarySearchHit[];
  addEntity: (sharedId: string) => void;
  onDeleted: () => void;
};

const useLibrarySelectionChrome = ({
  selectedIds,
  orderedIds,
  rows,
  addEntity,
  onDeleted,
}: LibrarySelectionChromeArgs) => {
  const panel = useLibrarySelectionPanel(selectedIds, orderedIds);
  useLibraryLongPress(addEntity);
  const commands = useLibraryInspectCommands(selectedIds, rows, onDeleted);
  return { ...panel, ...commands };
};

export { useLibraryCreateActions, useLibrarySelectionChrome, useLibrarySelectionPanel };

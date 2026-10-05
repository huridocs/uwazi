import { useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { libraryTableDisplayAtom } from './libraryTableDisplayAtom.js';
import {
  visibleLibraryTableColumns,
  libraryTableColumnGroups,
  libraryTableColumns,
  toggleColumnVisibility,
  type LibraryTableDensity,
} from './libraryTableColumns.js';

const useLibraryTableDisplay = (selectedTemplateIds: string[]) => {
  const templates = useAtomValue(templatesAtom);
  const [tableDisplay, setTableDisplay] = useAtom(libraryTableDisplayAtom);
  const tableColumnGroups = useMemo(
    () => libraryTableColumnGroups(templates, selectedTemplateIds),
    [selectedTemplateIds, templates]
  );
  const tableColumns = useMemo(
    () => libraryTableColumns(templates, selectedTemplateIds),
    [selectedTemplateIds, templates]
  );
  const visibleTableColumns = useMemo(
    () => visibleLibraryTableColumns(tableColumns, tableDisplay),
    [tableColumns, tableDisplay]
  );

  return {
    tableColumns,
    tableColumnGroups,
    visibleTableColumns,
    tableDisplay,
    onToggleTableColumn: (id: string) =>
      setTableDisplay(current => toggleColumnVisibility(id, current)),
    onTableDensityChange: (density: LibraryTableDensity) =>
      setTableDisplay(current => ({ ...current, density })),
  };
};

const useLibraryPreviewFocus = (
  onSelect: (sharedId: string) => void,
  onClosePreview: () => void
) => {
  const [focusFieldKey, setFocusFieldKey] = useState<string>();
  return {
    focusFieldKey,
    selectRow: (sharedId: string) => {
      setFocusFieldKey(undefined);
      onSelect(sharedId);
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
  onSelect: (sharedId: string) => void,
  onClosePreview: () => void,
  onEntityCreated?: (sharedId?: string) => void
) => {
  const [creating, setCreating] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const preview = useLibraryPreviewFocus(
    sharedId => {
      setCreating(false);
      onSelect(sharedId);
    },
    () => {
      setCreating(false);
      onClosePreview();
    }
  );
  return {
    ...preview,
    creating,
    uploadOpen,
    openCreate: () => {
      preview.closePreview();
      setCreating(true);
    },
    openUpload: () => setUploadOpen(true),
    closeUpload: () => setUploadOpen(false),
    finishCreated: (sharedId?: string) => {
      setCreating(false);
      setUploadOpen(false);
      onEntityCreated?.(sharedId);
      if (sharedId) {
        preview.selectRow(sharedId);
      }
    },
  };
};

export { useLibraryCreateActions, useLibraryTableDisplay };

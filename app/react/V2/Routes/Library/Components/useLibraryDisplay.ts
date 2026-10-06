import { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { libraryCardDisplayAtom } from './libraryCardDisplayAtom.js';
import type { ThumbFrame, ThumbSize } from './libraryCardDisplay.js';
import { libraryTableDisplayAtom } from './libraryTableDisplayAtom.js';
import {
  visibleLibraryTableColumns,
  libraryTableColumnGroups,
  libraryTableColumns,
  toggleColumnVisibility,
  type LibraryTableDensity,
} from './libraryTableColumns.js';

const useLibraryCardDisplay = () => {
  const [cardDisplay, setCardDisplay] = useAtom(libraryCardDisplayAtom);
  return {
    showThumbnail: cardDisplay.showThumbnail,
    showMetadata: cardDisplay.showMetadata,
    thumbFrame: cardDisplay.thumbFrame,
    thumbSize: cardDisplay.thumbSize,
    onShowThumbnailChange: (showThumbnail: boolean) =>
      setCardDisplay(current => ({ ...current, showThumbnail })),
    onShowMetadataChange: (showMetadata: boolean) =>
      setCardDisplay(current => ({ ...current, showMetadata })),
    onThumbFrameChange: (thumbFrame: ThumbFrame) =>
      setCardDisplay(current => ({ ...current, thumbFrame })),
    onThumbSizeChange: (thumbSize: ThumbSize) =>
      setCardDisplay(current => ({ ...current, thumbSize })),
  };
};

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

export { useLibraryCardDisplay, useLibraryTableDisplay };

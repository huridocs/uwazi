import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import { selectionHandlers } from '#V2/Components/PDFViewer/index.js';
import type { TextHighlight } from '#V2/Components/PDFViewer/types.js';

const PDF_SELECTION_COLORS = {
  saved: '#B1F7A3',
  draft: '#F27DA5',
} as const;

type PropertySelectionHighlights = { [page: number]: TextHighlight[] };

type LabeledPropertySelection = PropertySelectionSchema & { isSaved: boolean };

const selectionKey = (selection: PropertySelectionSchema) =>
  selection.propertyID || selection.name || '';

const matchesProperty = (
  selection: PropertySelectionSchema,
  property: { name: string; id?: string }
) =>
  (property.id !== undefined && selection.propertyID === property.id) ||
  selection.name === property.name;

const mergePropertySelections = (
  saved: PropertySelectionSchema[] | undefined,
  draft: PropertySelectionSchema[]
): LabeledPropertySelection[] => {
  const byKey = new Map<string, LabeledPropertySelection>();

  (saved || []).forEach(selection => {
    if (selection.deleteSelection) return;
    const key = selectionKey(selection);
    if (!key) return;
    byKey.set(key, { ...selection, isSaved: true });
  });

  draft.forEach(selection => {
    const key = selectionKey(selection);
    if (!key) return;
    if (selection.deleteSelection) {
      byKey.delete(key);
      return;
    }
    byKey.set(key, { ...selection, isSaved: false });
  });

  return [...byKey.values()];
};

const propertyHasSelection = (
  saved: PropertySelectionSchema[] | undefined,
  draft: PropertySelectionSchema[],
  property: { name: string; id?: string }
) => mergePropertySelections(saved, draft).some(selection => matchesProperty(selection, property));

const upsertDraftSelection = (
  draft: PropertySelectionSchema[],
  property: { name: string; id?: string },
  selection: TextSelection
): PropertySelectionSchema[] => {
  const updated = selectionHandlers.updateFileSelection(property, draft, selection);
  return updated.map(entry => {
    if (!matchesProperty(entry, property)) return entry;
    const { deleteSelection: _removed, ...rest } = entry;
    return rest;
  });
};

const clearDraftSelection = (
  draft: PropertySelectionSchema[],
  property: { name: string; id?: string }
): PropertySelectionSchema[] => {
  const without = selectionHandlers.deleteFileSelection(property, draft);
  return [
    ...without,
    {
      name: property.name,
      ...(property.id ? { propertyID: property.id } : {}),
      selection: { text: '', selectionRectangles: [] },
      deleteSelection: true,
    },
  ];
};

const buildPropertySelectionHighlights = (
  selections: LabeledPropertySelection[]
): PropertySelectionHighlights => {
  const highlights: PropertySelectionHighlights = {};

  selections.forEach(selection => {
    const color = selection.isSaved ? PDF_SELECTION_COLORS.saved : PDF_SELECTION_COLORS.draft;
    const fromFile = selectionHandlers.getHighlightsFromFile(
      [selection],
      selection.name || '',
      color
    );
    Object.entries(fromFile).forEach(([page, pageHighlights]) => {
      const pageNumber = Number(page);
      highlights[pageNumber] = [...(highlights[pageNumber] || []), ...pageHighlights];
    });
  });

  return highlights;
};

export {
  PDF_SELECTION_COLORS,
  mergePropertySelections,
  propertyHasSelection,
  upsertDraftSelection,
  clearDraftSelection,
  buildPropertySelectionHighlights,
};
export type { LabeledPropertySelection, PropertySelectionHighlights };

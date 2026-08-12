/**
 * @jest-environment node
 */
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import {
  buildPendingPdfSelectionHighlights,
  buildPropertySelectionHighlights,
  clearDraftSelection,
  mergeHighlightMaps,
  mergePropertySelections,
  propertyHasSelection,
  PDF_SELECTION_COLORS,
  upsertDraftSelection,
} from '../propertySelectionHelpers.js';

const rectSelection = (text: string): TextSelection => ({
  text,
  selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
});

describe('propertySelectionHelpers', () => {
  describe('mergePropertySelections', () => {
    it('lets draft win over saved for the same property', () => {
      const merged = mergePropertySelections(
        [
          {
            name: 'title',
            selection: { text: 'saved', selectionRectangles: [] },
          },
        ],
        [
          {
            name: 'title',
            selection: { text: 'draft', selectionRectangles: [] },
          },
        ]
      );

      expect(merged).toEqual([
        {
          name: 'title',
          selection: { text: 'draft', selectionRectangles: [] },
          isSaved: false,
        },
      ]);
    });

    it('drops saved entries cleared in draft', () => {
      const merged = mergePropertySelections(
        [{ name: 'body', propertyID: 'p1', selection: { text: 'x', selectionRectangles: [] } }],
        [
          {
            name: 'body',
            propertyID: 'p1',
            deleteSelection: true,
            selection: { text: '', selectionRectangles: [] },
          },
        ]
      );
      expect(merged).toEqual([]);
    });
  });

  describe('propertyHasSelection', () => {
    it('is true for saved or draft selections and false after clear', () => {
      expect(
        propertyHasSelection(
          [{ name: 'title', selection: { text: 'a', selectionRectangles: [] } }],
          [],
          { name: 'title' }
        )
      ).toBe(true);

      expect(
        propertyHasSelection(
          [],
          [{ name: 'title', selection: { text: 'a', selectionRectangles: [] } }],
          {
            name: 'title',
          }
        )
      ).toBe(true);

      expect(
        propertyHasSelection(
          [{ name: 'title', selection: { text: 'a', selectionRectangles: [] } }],
          [
            {
              name: 'title',
              deleteSelection: true,
              selection: { text: '', selectionRectangles: [] },
            },
          ],
          { name: 'title' }
        )
      ).toBe(false);
    });
  });

  describe('upsertDraftSelection / clearDraftSelection', () => {
    it('upserts and strips deleteSelection when filling again', () => {
      const cleared = clearDraftSelection([], { name: 'title' });
      expect(cleared[0]?.deleteSelection).toBe(true);

      const filled = upsertDraftSelection(cleared, { name: 'title' }, rectSelection('hello'));
      expect(filled).toHaveLength(1);
      expect(filled[0]?.deleteSelection).toBeUndefined();
      expect(filled[0]?.selection?.text).toBe('hello');
    });
  });

  describe('buildPropertySelectionHighlights', () => {
    it('uses saved green and draft pink IX highlight colors', () => {
      const highlights = buildPropertySelectionHighlights([
        {
          name: 'title',
          isSaved: true,
          selection: {
            text: 'saved',
            selectionRectangles: [{ top: 1, left: 1, width: 2, height: 2, page: '1' }],
          },
        },
        {
          name: 'body',
          propertyID: 'p1',
          isSaved: false,
          selection: {
            text: 'draft',
            selectionRectangles: [{ top: 3, left: 3, width: 2, height: 2, page: '1' }],
          },
        },
      ]);

      expect(highlights[1]?.map(h => h.color)).toEqual([
        PDF_SELECTION_COLORS.saved,
        PDF_SELECTION_COLORS.draft,
      ]);
    });
  });

  describe('pending pdf selection highlights', () => {
    it('builds draft-colored highlights from the live selection', () => {
      const highlights = buildPendingPdfSelectionHighlights(rectSelection('live'));
      expect(highlights?.[1]?.[0]?.color).toBe(PDF_SELECTION_COLORS.draft);
      expect(highlights?.[1]?.[0]?.textSelection.text).toBe('live');
    });

    it('returns undefined without rectangles', () => {
      expect(
        buildPendingPdfSelectionHighlights({ text: 'x', selectionRectangles: [] })
      ).toBeUndefined();
    });

    it('merges pending selection onto property highlights', () => {
      const property = buildPropertySelectionHighlights([
        {
          name: 'title',
          isSaved: true,
          selection: {
            text: 'saved',
            selectionRectangles: [{ top: 1, left: 1, width: 2, height: 2, page: '1' }],
          },
        },
      ]);
      const pending = buildPendingPdfSelectionHighlights(rectSelection('pending'));
      const merged = mergeHighlightMaps(property, pending);
      expect(merged?.[1]?.map(h => h.color)).toEqual([
        PDF_SELECTION_COLORS.saved,
        PDF_SELECTION_COLORS.draft,
      ]);
    });
  });
});

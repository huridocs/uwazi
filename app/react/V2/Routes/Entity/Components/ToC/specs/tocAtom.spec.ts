/**
 * @jest-environment jsdom
 */
import { createStore } from 'jotai';
import { TocSchema } from 'shared/types/commonTypes';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { tocStateAtom, tocActions, convertTextSelectionToTocEntry } from '../tocAtom';

// Test data
const simpleToc: TocSchema[] = [
  {
    label: 'Introduction',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '1' }],
  },
  {
    label: 'Chapter 1',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '5' }],
  },
];

const nestedToc: TocSchema[] = [
  {
    label: 'Part I: Fundamentals',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '1' }],
  },
  {
    label: 'Chapter 1: Getting Started',
    indentation: 1,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '2' }],
  },
  {
    label: 'Section 1.1: Installation',
    indentation: 2,
    selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '3' }],
  },
];

describe('tocAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('tocStateAtom', () => {
    it('should have initial state', () => {
      const state = store.get(tocStateAtom);
      expect(state).toEqual({
        toc: undefined,
        isEditMode: false,
        expanded: {},
      });
    });
  });

  describe('tocActions.setToc', () => {
    it('should set the ToC', () => {
      store.set(tocActions.setToc, simpleToc);

      const state = store.get(tocStateAtom);
      expect(state.toc).toEqual(simpleToc);
      expect(state.isEditMode).toBe(false);
    });

    it('should set ToC to undefined', () => {
      store.set(tocActions.setToc, simpleToc);
      store.set(tocActions.setToc, undefined);

      const state = store.get(tocStateAtom);
      expect(state.toc).toBeUndefined();
    });
  });

  describe('tocActions.addEntry', () => {
    it('should add an entry to empty ToC', () => {
      const newEntry: TocSchema = {
        label: 'New Entry',
        indentation: 0,
        selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '1' }],
      };

      store.set(tocActions.addEntry, newEntry);

      const state = store.get(tocStateAtom);
      expect(state.toc).toHaveLength(1);
      expect(state.toc?.[0]).toEqual(newEntry);
      expect(state.isEditMode).toBe(true);
    });

    it('should add an entry to existing ToC', () => {
      store.set(tocActions.setToc, simpleToc);

      const newEntry: TocSchema = {
        label: 'New Entry',
        indentation: 0,
        selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '3' }],
      };

      store.set(tocActions.addEntry, newEntry);

      const state = store.get(tocStateAtom);
      expect(state.toc).toHaveLength(3);
      expect(state.isEditMode).toBe(true);
      // Should be sorted by page number
      expect(state.toc?.[1].label).toBe('New Entry');
    });

    it('should automatically set edit mode to true', () => {
      store.set(tocActions.setToc, simpleToc);
      store.set(tocActions.setEditMode, false);

      const newEntry: TocSchema = {
        label: 'New Entry',
        indentation: 0,
        selectionRectangles: [{ top: 0, left: 0, width: 100, height: 20, page: '3' }],
      };

      store.set(tocActions.addEntry, newEntry);

      const state = store.get(tocStateAtom);
      expect(state.isEditMode).toBe(true);
    });
  });

  describe('tocActions.setEditMode', () => {
    it('should set edit mode to true', () => {
      store.set(tocActions.setEditMode, true);

      const state = store.get(tocStateAtom);
      expect(state.isEditMode).toBe(true);
    });

    it('should set edit mode to false', () => {
      store.set(tocActions.setEditMode, true);
      store.set(tocActions.setEditMode, false);

      const state = store.get(tocStateAtom);
      expect(state.isEditMode).toBe(false);
    });
  });

  describe('tocActions.updateEntry', () => {
    it('should update an entry label', () => {
      store.set(tocActions.setToc, simpleToc);
      store.set(tocActions.updateEntry, 0, { label: 'Updated Introduction' });

      const state = store.get(tocStateAtom);
      expect(state.toc?.[0].label).toBe('Updated Introduction');
      expect(state.toc?.[1].label).toBe('Chapter 1'); // Unchanged
    });

    it('should update an entry indentation', () => {
      store.set(tocActions.setToc, simpleToc);
      store.set(tocActions.updateEntry, 0, { indentation: 1 });

      const state = store.get(tocStateAtom);
      expect(state.toc?.[0].indentation).toBe(1);
    });

    it('should not update if ToC is undefined', () => {
      // Should not throw
      store.set(tocActions.updateEntry, 0, { label: 'Test' });

      const state = store.get(tocStateAtom);
      expect(state.toc).toBeUndefined();
    });
  });

  describe('tocActions.deleteEntry', () => {
    it('should delete an entry', () => {
      store.set(tocActions.setToc, simpleToc);
      store.set(tocActions.deleteEntry, 0);

      const state = store.get(tocStateAtom);
      expect(state.toc).toHaveLength(1);
      expect(state.toc?.[0].label).toBe('Chapter 1');
    });

    it('should not delete if ToC is undefined', () => {
      // Should not throw
      store.set(tocActions.deleteEntry, 0);

      const state = store.get(tocStateAtom);
      expect(state.toc).toBeUndefined();
    });
  });

  describe('tocActions.toggleExpand', () => {
    it('should toggle expand state for an index', () => {
      store.set(tocActions.toggleExpand, 0);
      let state = store.get(tocStateAtom);
      expect(state.expanded[0]).toBe(true);

      store.set(tocActions.toggleExpand, 0);
      state = store.get(tocStateAtom);
      expect(state.expanded[0]).toBe(false);
    });

    it('should handle multiple expanded items', () => {
      store.set(tocActions.toggleExpand, 0);
      store.set(tocActions.toggleExpand, 1);
      store.set(tocActions.toggleExpand, 2);

      const state = store.get(tocStateAtom);
      expect(state.expanded[0]).toBe(true);
      expect(state.expanded[1]).toBe(true);
      expect(state.expanded[2]).toBe(true);
    });
  });

  describe('tocActions.expandAll', () => {
    it('should expand all items with children', () => {
      store.set(tocActions.setToc, nestedToc);
      store.set(tocActions.expandAll);

      const state = store.get(tocStateAtom);
      // Items with children should be expanded
      // Part I has children (Chapter 1), Chapter 1 has children (Section 1.1)
      expect(Object.keys(state.expanded).length).toBeGreaterThan(0);
    });

    it('should not expand if ToC is undefined', () => {
      store.set(tocActions.expandAll);

      const state = store.get(tocStateAtom);
      expect(state.expanded).toEqual({});
    });
  });

  describe('tocActions.collapseAll', () => {
    it('should collapse all items', () => {
      store.set(tocActions.setToc, nestedToc);
      store.set(tocActions.expandAll);
      store.set(tocActions.collapseAll);

      const state = store.get(tocStateAtom);
      expect(state.expanded).toEqual({});
    });
  });

  describe('convertTextSelectionToTocEntry', () => {
    it('should convert TextSelection to TocSchema', () => {
      const selection: TextSelection = {
        text: 'Selected text',
        selectionRectangles: [
          {
            top: 10,
            left: 20,
            width: 100,
            height: 20,
            regionId: '1',
          },
        ],
      };

      const result = convertTextSelectionToTocEntry(selection);

      expect(result).toEqual({
        label: 'Selected text',
        selectionRectangles: [
          {
            top: 10,
            left: 20,
            width: 100,
            height: 20,
            page: '1',
          },
        ],
        indentation: 0,
      });
    });

    it('should handle empty text', () => {
      const selection: TextSelection = {
        text: '',
        selectionRectangles: [
          {
            top: 10,
            left: 20,
            width: 100,
            height: 20,
            regionId: '1',
          },
        ],
      };

      const result = convertTextSelectionToTocEntry(selection);

      expect(result.label).toBe('');
    });

    it('should handle multiple selection rectangles', () => {
      const selection: TextSelection = {
        text: 'Multi-line selection',
        selectionRectangles: [
          {
            top: 10,
            left: 20,
            width: 100,
            height: 20,
            regionId: '1',
          },
          {
            top: 40,
            left: 20,
            width: 100,
            height: 20,
            regionId: '1',
          },
        ],
      };

      const result = convertTextSelectionToTocEntry(selection);

      expect(result.selectionRectangles).toHaveLength(2);
      expect(result.selectionRectangles?.[0]?.page).toBe('1');
      expect(result.selectionRectangles?.[1]?.page).toBe('1');
    });

    it('should trim text', () => {
      const selection: TextSelection = {
        text: '  Padded text  ',
        selectionRectangles: [
          {
            top: 10,
            left: 20,
            width: 100,
            height: 20,
            regionId: '1',
          },
        ],
      };

      const result = convertTextSelectionToTocEntry(selection);

      expect(result.label).toBe('Padded text');
    });
  });
});

import { atom, useAtomValue, useAtom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { TocSchema } from 'shared/types/commonTypes';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { sortTocEntries } from './ToC';
import { normalizeToc, findItemsWithChildren } from './utils';

type TocState = {
  toc: TocSchema[] | undefined;
  isEditMode: boolean;
  expanded: Record<number, boolean>;
};

// Base state atom
const tocStateAtom = atomWithReset<TocState>({
  toc: undefined,
  isEditMode: false,
  expanded: {},
});

// Helper to convert TextSelection to TocSchema
const convertTextSelectionToTocEntry = (selection: TextSelection): TocSchema => ({
  label: selection.text?.trim() || '',
  selectionRectangles: selection.selectionRectangles.map(rect => ({
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    page: rect.regionId, // Convert regionId to page
  })),
  indentation: 0,
});

// Action atoms
const tocActions = {
  addEntry: atom(null, (get, set, entry: TocSchema) => {
    const current = get(tocStateAtom);
    const newToc = current.toc ? [...current.toc, entry] : [entry];
    const sortedToc = sortTocEntries(newToc);
    // When adding entry, enter edit mode and expand all items
    const normalized = normalizeToc(sortedToc);
    const itemsWithChildren = findItemsWithChildren(normalized);
    const allExpanded: Record<number, boolean> = {};
    itemsWithChildren.forEach(index => {
      allExpanded[index] = true;
    });
    set(tocStateAtom, {
      ...current,
      toc: sortedToc,
      isEditMode: true, // Auto-enter edit mode
      expanded: allExpanded,
    });
  }),

  setEditMode: atom(null, (get, set, enabled: boolean) => {
    const current = get(tocStateAtom);
    if (enabled && current.toc) {
      // When entering edit mode, expand all items
      const normalized = normalizeToc(current.toc);
      const itemsWithChildren = findItemsWithChildren(normalized);
      const allExpanded: Record<number, boolean> = {};
      itemsWithChildren.forEach(index => {
        allExpanded[index] = true;
      });
      set(tocStateAtom, { ...current, isEditMode: enabled, expanded: allExpanded });
    } else {
      set(tocStateAtom, { ...current, isEditMode: enabled });
    }
  }),

  updateEntry: atom(null, (get, set, index: number, entry: Partial<TocSchema>) => {
    const current = get(tocStateAtom);
    if (!current.toc) return;
    const updated = [...current.toc];
    updated[index] = { ...updated[index], ...entry };
    set(tocStateAtom, { ...current, toc: updated });
  }),

  deleteEntry: atom(null, (get, set, index: number) => {
    const current = get(tocStateAtom);
    if (!current.toc) return;
    const updated = current.toc.filter((_, i) => i !== index);
    set(tocStateAtom, { ...current, toc: updated });
  }),

  expandAll: atom(null, (get, set) => {
    const current = get(tocStateAtom);
    if (!current.toc) return;

    const normalized = normalizeToc(current.toc);
    const itemsWithChildren = findItemsWithChildren(normalized);

    const allExpanded: Record<number, boolean> = {};
    itemsWithChildren.forEach(index => {
      allExpanded[index] = true;
    });

    set(tocStateAtom, { ...current, expanded: allExpanded });
  }),

  collapseAll: atom(null, (get, set) => {
    const current = get(tocStateAtom);
    set(tocStateAtom, { ...current, expanded: {} });
  }),

  toggleExpand: atom(null, (get, set, index: number) => {
    const current = get(tocStateAtom);
    set(tocStateAtom, {
      ...current,
      expanded: {
        ...current.expanded,
        [index]: !current.expanded[index],
      },
    });
  }),

  setToc: atom(null, (get, set, toc: TocSchema[] | undefined) => {
    const current = get(tocStateAtom);
    set(tocStateAtom, { ...current, toc });
  }),
};

// Custom hook to access ToC state only (doesn't cause rerenders when actions are called)
export function useToc() {
  return useAtomValue(tocStateAtom);
}

// Custom hook to access ToC actions only (doesn't subscribe to state changes)
export function useTocActions() {
  const [, addEntry] = useAtom(tocActions.addEntry);
  const [, setToc] = useAtom(tocActions.setToc);
  const [, expandAll] = useAtom(tocActions.expandAll);
  const [, collapseAll] = useAtom(tocActions.collapseAll);
  const [, setEditMode] = useAtom(tocActions.setEditMode);
  const [, updateEntry] = useAtom(tocActions.updateEntry);
  const [, deleteEntry] = useAtom(tocActions.deleteEntry);
  const [, toggleExpand] = useAtom(tocActions.toggleExpand);
  const reset = useResetAtom(tocStateAtom);

  return {
    addEntry,
    setToc,
    expandAll,
    collapseAll,
    setEditMode,
    updateEntry,
    deleteEntry,
    toggleExpand,
    reset,
  };
}

// Export statements
export { tocStateAtom, tocActions, convertTextSelectionToTocEntry };

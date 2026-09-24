type LibraryClickModifiers = {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
};

type LibrarySelection = {
  ids: string[];
  anchorId?: string;
};

const EMPTY_CLICK_MODIFIERS: LibraryClickModifiers = {
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
};

const toggleHeld = (modifiers: LibraryClickModifiers) => modifiers.ctrlKey || modifiers.metaKey;

const uniqueIds = (ids: readonly string[]) => {
  const seen = new Set<string>();
  const unique: string[] = [];
  ids.forEach(id => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    unique.push(id);
  });
  return unique;
};

const rangeIds = (orderedIds: readonly string[], anchorId: string, clickedId: string) => {
  const start = orderedIds.indexOf(anchorId);
  const end = orderedIds.indexOf(clickedId);
  if (start < 0 || end < 0) {
    return undefined;
  }
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  return orderedIds.slice(from, to + 1);
};

const toggleId = (ids: readonly string[], id: string) =>
  ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];

const replaceWith = (clickedId: string): LibrarySelection => ({
  ids: [clickedId],
  anchorId: clickedId,
});

/** Touch long-press: keep the current selection and include this entity. */
const addLibraryEntity = (selection: LibrarySelection, clickedId: string): LibrarySelection => {
  if (!clickedId) {
    return selection;
  }
  if (selection.ids.includes(clickedId)) {
    return { ids: selection.ids, anchorId: clickedId };
  }
  return { ids: [...selection.ids, clickedId], anchorId: clickedId };
};

const shiftRangeSelection = (
  selection: LibrarySelection,
  orderedIds: readonly string[],
  clickedId: string
): LibrarySelection => {
  const anchorId = selection.anchorId ?? selection.ids[selection.ids.length - 1];
  if (!anchorId) {
    return replaceWith(clickedId);
  }
  const range = rangeIds(orderedIds, anchorId, clickedId);
  if (!range) {
    return replaceWith(clickedId);
  }
  return { ids: range, anchorId };
};

const toggleSelection = (selection: LibrarySelection, clickedId: string): LibrarySelection => {
  const ids = toggleId(selection.ids, clickedId);
  return {
    ids,
    anchorId: ids.includes(clickedId) ? clickedId : ids[ids.length - 1],
  };
};

const applyLibraryEntityClick = ({
  selection,
  orderedIds,
  clickedId,
  modifiers,
  allowRange,
}: {
  selection: LibrarySelection;
  orderedIds: readonly string[];
  clickedId: string;
  modifiers: LibraryClickModifiers;
  allowRange: boolean;
}): LibrarySelection => {
  if (allowRange && modifiers.shiftKey && !toggleHeld(modifiers)) {
    return shiftRangeSelection(selection, orderedIds, clickedId);
  }
  if (toggleHeld(modifiers)) {
    return toggleSelection(selection, clickedId);
  }
  return replaceWith(clickedId);
};

const applyLibraryClusterClick = ({
  selection,
  clusterIds,
  modifiers,
}: {
  selection: LibrarySelection;
  clusterIds: readonly string[];
  modifiers: LibraryClickModifiers;
}): LibrarySelection => {
  const unique = uniqueIds(clusterIds);
  if (unique.length === 0) {
    return selection;
  }

  if (toggleHeld(modifiers)) {
    const allSelected = unique.every(id => selection.ids.includes(id));
    const ids = allSelected
      ? selection.ids.filter(id => !unique.includes(id))
      : uniqueIds([...selection.ids, ...unique]);
    return { ids, anchorId: ids[ids.length - 1] };
  }

  return { ids: unique, anchorId: unique[0] };
};

/** Selected ids in library result order, with ids missing from the current page after that. */
const orderedSelectionIds = (rowIds: readonly string[], selectedIds: readonly string[]) => {
  const inView = rowIds.filter(id => selectedIds.includes(id));
  const extras = selectedIds.filter(id => !inView.includes(id));
  return [...inView, ...extras];
};

export type { LibraryClickModifiers, LibrarySelection };
export {
  EMPTY_CLICK_MODIFIERS,
  addLibraryEntity,
  applyLibraryClusterClick,
  applyLibraryEntityClick,
  orderedSelectionIds,
};

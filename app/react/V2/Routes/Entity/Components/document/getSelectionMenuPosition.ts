import type { TextSelection } from '@huridocs/react-text-selection-handler';

type SelectionMenuPosition = { x: number; y: number };

const getSelectionMenuPosition = (selection: TextSelection): SelectionMenuPosition | undefined => {
  const [first] = selection.selectionRectangles;
  if (!first) return undefined;

  const page = first.regionId ?? '1';
  const pageContainer = document.querySelector<HTMLElement>(`#page-${page}-container`);
  if (!pageContainer) return undefined;

  const pageRect = pageContainer.getBoundingClientRect();
  return {
    x: pageRect.left + (first.left ?? 0) + (first.width ?? 0) / 2,
    y: pageRect.top + (first.top ?? 0),
  };
};

export type { SelectionMenuPosition };
export { getSelectionMenuPosition };

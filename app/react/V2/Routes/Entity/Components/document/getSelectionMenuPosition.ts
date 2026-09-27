import type { TextSelection } from '@huridocs/react-text-selection-handler';

type SelectionMenuPosition = { x: number; y: number };

const getSelectionMenuPosition = (selection: TextSelection): SelectionMenuPosition | undefined => {
  const last = selection.selectionRectangles.at(-1);
  if (!last) return undefined;

  const page = last.regionId ?? '1';
  const pageContainer = document.querySelector<HTMLElement>(`#page-${page}-container`);
  if (!pageContainer) return undefined;

  const pageRect = pageContainer.getBoundingClientRect();
  return {
    x: pageRect.left + (last.left ?? 0) + (last.width ?? 0),
    y: pageRect.top + (last.top ?? 0),
  };
};

export type { SelectionMenuPosition };
export { getSelectionMenuPosition };

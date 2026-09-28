import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { clearControlAnchor } from '#V2/Components/PDFViewer/functions/clearControlAnchor.js';

type SelectionMenuPosition = { host: HTMLElement; x: number; y: number };

const getSelectionMenuPosition = (selection: TextSelection): SelectionMenuPosition | undefined => {
  const last = selection.selectionRectangles.at(-1);
  if (!last) return undefined;

  const page = last.regionId ?? '1';
  const host = document.querySelector<HTMLElement>(`#page-${page}-container`);
  if (!host) return undefined;

  return { host, ...clearControlAnchor(last) };
};

export type { SelectionMenuPosition };
export { getSelectionMenuPosition };

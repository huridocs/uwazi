import { Selection, TextReferencePointer } from '#V2/formatters/relationships/types.js';
import type { TextHighlight } from '../types.js';

type Highlight = { [page: number]: TextHighlight[] };

const relationshipToHighlight = (
  anchor: TextReferencePointer | undefined,
  color?: string
): Highlight | undefined => {
  if (!anchor?.selections.length) {
    return undefined;
  }

  const groups = anchor.selections.reduce<Record<number, Selection[]>>((acc, selection) => {
    (acc[selection.page] ??= []).push(selection);
    return acc;
  }, {});

  const highlight: Highlight = {};

  Object.keys(groups).forEach(pageKey => {
    const page = Number(pageKey);
    highlight[page] = [
      {
        key: pageKey,
        textSelection: {
          text: anchor.text,
          selectionRectangles: groups[page].map(selection => ({
            top: selection.top,
            left: selection.left,
            width: selection.width,
            height: selection.height,
            regionId: String(selection.page),
          })),
        },
        color: color || '#ffd84b',
      },
    ];
  });

  return Object.keys(highlight).length ? highlight : undefined;
};

export { relationshipToHighlight };

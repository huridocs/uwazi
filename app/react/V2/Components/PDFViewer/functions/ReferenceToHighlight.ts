import { EntityReference } from '#V2/formatters/relationships/types.js';
import type { TextHighlight } from '../types.js';

type Reference = EntityReference & {
  targetEntity: EntityReference['targetEntity'] & {
    template?: { _id?: string; name?: string; color?: string };
  };
};

type Highlight = { [page: number]: TextHighlight[] };

const referenceToHighlight = (reference: Reference): Highlight | undefined => {
  const selectionRectangles = reference.reference?.selectionRectangles;

  if (!selectionRectangles || selectionRectangles.length === 0) {
    return undefined;
  }

  const groups: Record<string, typeof selectionRectangles> = selectionRectangles.reduce(
    (acc, r) => {
      const pageKey = (r.page ?? '').toString();
      if (!pageKey) return acc;
      if (!acc[pageKey]) acc[pageKey] = [];
      acc[pageKey].push(r);
      return acc;
    },
    {} as Record<string, typeof selectionRectangles>
  );

  const highlight: Highlight = {};

  Object.keys(groups).forEach(pageKey => {
    const pageNumber = Number(pageKey);
    const rectanglesForPage = groups[pageKey].map(r => ({
      top: r.top || 0,
      left: r.left || 0,
      width: r.width || 0,
      height: r.height || 0,
      regionId: (r.page ?? '0').toString(),
    }));

    const textSelection = {
      text: reference.reference?.text || '',
      selectionRectangles: rectanglesForPage,
    };

    highlight[pageNumber] = [
      {
        key: pageKey,
        textSelection,
        color: reference.targetEntity.template?.color || '#ffd84b',
      },
    ];
  });

  return Object.keys(highlight).length ? highlight : undefined;
};

export { referenceToHighlight };

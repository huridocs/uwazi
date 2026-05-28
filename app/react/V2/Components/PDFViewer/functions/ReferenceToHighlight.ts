import { EntityReference } from '#V2/formatters/relationships/types.js';
import { TextHighlight } from '../types';

type Reference = EntityReference & {
  targetEntity: EntityReference['targetEntity'] & {
    template?: { _id?: string; name?: string; color?: string };
  };
};

type Highlight = { [page: number]: TextHighlight[] };

const referenceToHighlight = (reference: Reference): Highlight | undefined => {
  const selectionRectangles = reference.reference?.selectionRectangles;
  let highlight: Highlight | undefined;

  if (selectionRectangles && selectionRectangles.length > 0) {
    const rectangle = selectionRectangles.find(selectionRectangle => selectionRectangle.page);
    if (rectangle?.page) {
      const page = Number(rectangle.page);

      const rectanglesForPage = selectionRectangles
        .filter(r => r.page === rectangle.page)
        .map(r => ({
          top: r.top || 0,
          left: r.left || 0,
          width: r.width || 0,
          height: r.height || 0,
          regionId: r.page || '0',
        }));

      const textSelection = {
        text: reference.reference?.text || '',
        selectionRectangles: rectanglesForPage,
      };

      highlight = {
        [page]: [
          {
            key: page.toString(),
            textSelection,
            color: reference.targetEntity.template?.color || '#ffd84b',
          },
        ],
      };
    }
  }

  return highlight;
};

export { referenceToHighlight };

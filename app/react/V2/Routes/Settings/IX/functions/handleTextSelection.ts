import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { Highlights } from '../types';

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

const highlightsForProperty = (
  selections: ExtractedMetadataSchema[],
  property: string
): Highlights => {
  const selectionsForProperty = selections.filter(selection => selection.name === property)[0];

  const selectionText = selectionsForProperty.selection?.text;

  const highlights: Highlights = {};

  selectionsForProperty.selection?.selectionRectangles?.forEach(rectangle => {
    const { page } = rectangle;
    if (!page) return;

    if (highlights[page]) {
      highlights[page][0].textSelection.selectionRectangles.push({
        left: rectangle.left!,
        top: rectangle.top!,
        width: rectangle.width!,
        height: rectangle.height!,
        regionId: page,
      });
    } else {
      highlights[page] = [
        {
          key: `${page}`,
          textSelection: {
            selectionRectangles: [
              {
                left: rectangle.left!,
                top: rectangle.top!,
                width: rectangle.width!,
                height: rectangle.height!,
                regionId: page,
              },
            ],
            text: selectionText,
          },
          color: HighlightColors.CURRENT,
        },
      ];
    }
  });

  return highlights;
};

export { highlightsForProperty };

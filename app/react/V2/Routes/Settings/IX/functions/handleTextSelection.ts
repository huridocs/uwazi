import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { Highlights } from '../types';

const getHighlightsFromFile = (
  selections: ExtractedMetadataSchema[],
  property: string,
  color: string = 'lightyellow'
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
          color,
        },
      ];
    }
  });

  return highlights;
};

const getHighlightsFromSelection = (
  selection: TextSelection,
  color: string = 'lightyellow'
): Highlights => {
  const highlights: Highlights = {};

  const { text } = selection;

  selection.selectionRectangles.forEach(rectangle => {
    const page = rectangle.regionId;

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
            text,
          },
          color,
        },
      ];
    }
  });

  return highlights;
};

export { getHighlightsFromFile, getHighlightsFromSelection };

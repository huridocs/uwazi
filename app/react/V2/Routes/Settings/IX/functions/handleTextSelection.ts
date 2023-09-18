import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { Highlights } from '../types';

const getHighlightsFromFile = (
  selections: ExtractedMetadataSchema[],
  property: string,
  color: string = 'lightyellow'
): Highlights => {
  const selectionsForProperty = selections.filter(selection => selection.name === property)[0];

  const selectionText = selectionsForProperty?.selection?.text;

  const highlights: Highlights = {};

  selectionsForProperty?.selection?.selectionRectangles?.forEach(rectangle => {
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

const updateFileSelection = (
  property: { name: string; id?: string },
  currentSelections?: ExtractedMetadataSchema[],
  newSelection?: TextSelection
): ExtractedMetadataSchema[] => {
  const result = currentSelections || [];

  if (!newSelection) {
    return result;
  }

  const isNewSelection = !currentSelections?.find(
    selection => selection.propertyID === property.id || selection.name === property.name
  );

  const timestamp = new Date().toString();

  if (isNewSelection && property) {
    return [
      ...result,
      {
        name: property.name,
        ...(property.id && { propertyID: property.id }),
        timestamp,
        selection: {
          text: newSelection.text,
          selectionRectangles: newSelection.selectionRectangles.map(rectangle => {
            const formattedRectangle = {
              ...rectangle,
              page: rectangle.regionId,
            };
            delete formattedRectangle.regionId;

            return formattedRectangle;
          }),
        },
      },
    ];
  }

  const updatedSelections = result.map(selection => {
    if (selection.propertyID === property.id || selection.name === property.name) {
      return {
        ...selection,
        timestamp,
        selection: {
          text: newSelection.text,
          selectionRectangles: newSelection.selectionRectangles.map(rectangle => {
            const formattedRectangle = {
              ...rectangle,
              page: rectangle.regionId,
            };
            delete formattedRectangle.regionId;

            return formattedRectangle;
          }),
        },
      };
    }

    return selection;
  });

  return updatedSelections;
};

const deleteFileSelection = (
  property: { name: string; id?: string },
  currentSelections?: ExtractedMetadataSchema[]
) => {
  if (!currentSelections) {
    return [];
  }

  if (!property.name) {
    return currentSelections;
  }

  const updatedSelections = currentSelections.filter(selection => {
    if (property.id) {
      return property.id !== selection.propertyID;
    }
    return property.name !== selection.name;
  });

  return updatedSelections;
};

export {
  getHighlightsFromFile,
  getHighlightsFromSelection,
  updateFileSelection,
  deleteFileSelection,
};

import React from 'react';
import { uniqBy } from 'lodash';
import { Highlight } from 'react-text-selection-handler';
import { PDF } from 'app/V2/Components/PDFViewer';
import { ExtractedMetadataSchema, SelectionRectangleSchema } from 'shared/types/commonTypes';
import { PDFProps } from 'app/V2/Components/PDFViewer/PDF';

interface Selection extends ExtractedMetadataSchema {
  isCurrent?: boolean;
}

interface PDFWithSelectionProps extends PDFProps {
  selections?: Selection[];
}

const uniqueSelections = (selections: Selection[], newSelections: Selection[]) => {
  const result = uniqBy([...newSelections, ...selections], 'propertyID');
  return result;
};

const PDFWithSelections = ({ fileUrl, selections, onSelect }: PDFWithSelectionProps) => {
  //   const newSelections = [];

  const currentSelections = selections?.map((currentSelection: Selection) => ({
    ...currentSelection,
    isCurrent: true,
  }));

  //   const fileSelections = uniqueSelections(currentSelections || [], newSelections || []);

  return (
    <>
      {currentSelections?.length &&
        currentSelections.map(selection => {
          const selected = selection.selection;
          const rectangles = (selected?.selectionRectangles || []).map(rectangle => ({
            regionId: rectangle.page,
            ...(rectangle as Required<SelectionRectangleSchema>),
          }));
          const highlight = {
            text: selected?.text,
            selectionRectangles: rectangles,
          };

          return (
            <div
              key={selection.propertyID || selection.name}
              data-testid={selection.timestamp}
              className="selection"
            >
              <Highlight
                textSelection={highlight}
                color={selection.isCurrent ? '#B1F7A3' : '#F27DA5'}
              />
            </div>
          );
        })}
      <PDF fileUrl={fileUrl} onSelect={onSelect} />;
    </>
  );
};

export { PDFWithSelections };

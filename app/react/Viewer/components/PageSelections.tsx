import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import uniqBy from 'lodash/uniqBy';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { IStore } from '#app/istore.js';
import { PropertySelectionSchema, SelectionRectangleSchema } from '#shared/types/commonTypes.js';
import { selectionHandlers } from '#app/V2/Components/PDFViewer/index.js';

interface Selection extends PropertySelectionSchema {
  isCurrent?: boolean;
}

const uniqueSelections = (selections: Selection[], newSelections: Selection[]) => {
  const result = uniqBy([...newSelections, ...selections], 'propertyID');
  return result;
};

const mapStateToProps = (state: IStore) => ({
  userSelections: state.documentViewer.metadataExtraction.get('selections'),
  entityDocument: state.documentViewer.doc.get('defaultDoc'),
  isEditing: Boolean(state.documentViewer.sidepanel.metadata._id),
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

interface PageSelectionsOwnProps {
  /** Scale at which the PDF page is rendered; highlights (stored in scale=1) are scaled by this for display */
  renderScale?: number;
}

const PageSelectionsComponent = ({
  userSelections,
  entityDocument,
  isEditing,
  renderScale = 1,
}: mappedProps & PageSelectionsOwnProps) => {
  // Stored selections are in scale=1; multiply by renderScale to get display coordinates
  const pdfScaleFactor = renderScale;

  if (!isEditing || !entityDocument?.get('_id')) {
    return null;
  }

  const newSelections: Selection[] = userSelections.toJS();

  const currentSelections: Selection[] = entityDocument.get('propertySelections')?.size
    ? entityDocument.toJS().propertySelections!.map((currentSelection: Selection) => ({
        ...currentSelection,
        isCurrent: true,
      }))
    : [];

  const selections = uniqueSelections(currentSelections, newSelections);

  if (selections.length) {
    return (
      <>
        {selections.map(selection => {
          const selected = selection.selection;
          const rectangles = (selected?.selectionRectangles || []).map(rectangle => ({
            regionId: rectangle.page,
            ...(rectangle as Required<SelectionRectangleSchema>),
          }));
          const highlight = selectionHandlers.adjustSelectionsToScale(
            {
              text: selected?.text,
              selectionRectangles: rectangles,
            },
            pdfScaleFactor
          );

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
      </>
    );
  }

  return null;
};

const container = connector(PageSelectionsComponent);

export { container as PageSelections };

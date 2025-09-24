import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { uniqBy } from 'lodash';
import { useAtomValue } from 'jotai';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { IStore } from '../../istore.js';
import {
  ExtractedMetadataSchema,
  SelectionRectangleSchema,

} from 'shared/types/commonTypes.js';
import { pdfScaleAtom } from '../../V2/atoms/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/PDFViewer.... Remove this comment to see the full error message
import { selectionHandlers } from '../../V2/Components/PDFViewer.js';

interface Selection extends ExtractedMetadataSchema {
  isCurrent?: boolean;
}

const uniqueSelections = (selections: Selection[], newSelections: Selection[]) => {
  const result = uniqBy([...newSelections, ...selections], 'propertyID');
  return result;
};

const mapStateToProps = (state: IStore) => ({
  userSelections: state.documentViewer.metadataExtraction.get('selections'),
  entityDocument: state.documentViewer.doc.get('defaultDoc'),
  // @ts-expect-error TS(2339): Property '_id' does not exist on type 'ClientEntit... Remove this comment to see the full error message
  isEditing: Boolean(state.documentViewer.sidepanel.metadata._id),
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const PageSelectionsComponent = ({ userSelections, entityDocument, isEditing }: mappedProps) => {
  const pdfScaleFactor = useAtomValue(pdfScaleAtom);

  if (!isEditing || !entityDocument?.get('_id')) {
    return null;
  }

  const newSelections: Selection[] = userSelections.toJS();

  const currentSelections: Selection[] = entityDocument.get('extractedMetadata')?.size
    ? entityDocument.toJS().extractedMetadata!.map((currentSelection: Selection) => ({
      ...currentSelection,
      isCurrent: true,
    }))
    : [];

  const selections = uniqueSelections(currentSelections, newSelections);

  if (selections.length) {
    return (
      <>
        {selections.map(selection => {
          // @ts-expect-error TS(2339): Property 'selection' does not exist on type 'Selec... Remove this comment to see the full error message
          const selected = selection.selection;
          // @ts-expect-error TS(7006): Parameter 'rectangle' implicitly has an 'any' type... Remove this comment to see the full error message
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
              // @ts-expect-error TS(2339): Property 'propertyID' does not exist on type 'Sele... Remove this comment to see the full error message
              key={selection.propertyID || selection.name}
              // @ts-expect-error TS(2339): Property 'timestamp' does not exist on type 'Selec... Remove this comment to see the full error message
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

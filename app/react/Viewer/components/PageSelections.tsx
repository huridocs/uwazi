import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { uniqBy } from 'lodash';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { IStore } from 'app/istore';
import { ExtractedMetadataSchema, SelectionRectangleSchema } from 'shared/types/commonTypes';

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
  isEditing: Boolean(state.documentViewer.sidepanel.metadata._id),
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const PageSelectionsComponent = ({ userSelections, entityDocument, isEditing }: mappedProps) => {
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
      </>
    );
  }

  return null;
};

const container = connector(PageSelectionsComponent);

export { container as PageSelections };

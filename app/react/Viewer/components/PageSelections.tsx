import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Highlight } from 'react-text-selection-handler';
import { IStore } from 'app/istore';
import { SelectionRectanglesSchema } from 'shared/types/commonTypes';

const mapStateToProps = (state: IStore) => ({
  newSelections: state.documentViewer.metadataExtraction.get('selections'),
  entityDocument: state.documentViewer.doc.get('defaultDoc'),
  isEditing: Boolean(state.documentViewer.sidepanel.metadata._id),
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const PageSelectionsComponent = ({ newSelections, entityDocument, isEditing }: mappedProps) => {
  if (!isEditing || !entityDocument?.get('_id')) {
    return null;
  }

  const currentSelections = entityDocument.toJS().extractedMetadata?.length
    ? entityDocument
        .toJS()
        .extractedMetadata!.map(currentSelection => ({ ...currentSelection, isCurrent: true }))
    : [];

  const selections = [...currentSelections, ...newSelections.toJS()];

  if (selections.length) {
    return (
      <>
        {selections.map(selection => {
          const selected = selection.selection;
          const rectangles = (selected.selectionRectangles as SelectionRectanglesSchema).map(
            rectangle => ({
              regionId: rectangle.page,
              ...rectangle,
            })
          );
          const highlight = { text: selected.text, selectionRectangles: rectangles };

          return (
            <div key={selection.propertyID || selection.name}>
              <Highlight
                textSelection={highlight}
                color={selection.isCurrent ? '#A3D7A3' : '#F27DA5'}
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

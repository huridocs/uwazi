import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Highlight } from 'react-text-selection-handler';
import { ClientFile, IStore } from 'app/istore';
import { isBlobFile } from 'shared/tsUtils';
import { IImmutable } from 'shared/types/Immutable';
import { SelectionRectanglesSchema } from 'shared/types/commonTypes';

const mapStateToProps = (state: IStore) => {
  const currentDocumentId = state.documentViewer.doc.get('defaultDoc')?.get('_id');
  const entityDocuments = state.documentViewer.doc
    .get('documents')
    ?.filter(document => !isBlobFile(document)) as unknown as IImmutable<ClientFile[]>;
  const entityDocument = entityDocuments.filter(
    document => document?.get('_id') === currentDocumentId
  );

  return {
    newSelections: state.documentViewer.metadataExtraction.get('selections'),
    entityDocument: entityDocument.get(0),
  };
};

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const PageSelectionsComponent = ({ newSelections, entityDocument }: mappedProps) => {
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
            <Highlight
              textSelection={highlight}
              color={selection.isCurrent ? '#359990' : '#5cb85c'}
            />
          );
        })}
      </>
    );
  }

  return <></>;
};

const container = connector(PageSelectionsComponent);

export { container as PageSelections };

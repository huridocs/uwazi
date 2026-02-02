import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import uniqBy from 'lodash/uniqBy.js';

import { IImmutable } from '#shared/types/Immutable.js';

import { ExtractedMetadataSchema } from '#shared/types/commonTypes.js';
import { ClientFile, IStore } from '#app/istore.js';
import { Translate } from '#app/I18N/index.js';
import { deleteSelection } from '../actions/metadataExtractionActions.js';

type deleteSelectionButtonProps = {
  propertyName: string;
  propertyID?: string;
};

const checkPropertySelections = (property: string, selections?: ExtractedMetadataSchema[]) =>
  selections?.filter(selection => {
    if (selection.deleteSelection) {
      return false;
    }
    return (
      (property === 'title' && selection.name === 'title') || selection.propertyID === property
    );
  });

const mapStateToProps = (state: IStore) => {
  const entityDocument = state.documentViewer.doc.get('defaultDoc');
  const newSelections = state.documentViewer.metadataExtraction.get('selections');
  return {
    entityDocument,
    newSelections,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      deleteSelectionAction: deleteSelection,
    },
    dispatch
  );

const mergeProps = (
  stateProps: {
    entityDocument: IImmutable<ClientFile> | undefined;
    newSelections: IImmutable<ExtractedMetadataSchema[]> | undefined;
  },
  dispatchProps: {
    deleteSelectionAction: (entityDocument: any, propertyName: string, propertyID?: string) => any;
  },
  ownProps: deleteSelectionButtonProps
) => ({
  onClickFunction: () =>
    dispatchProps.deleteSelectionAction(
      stateProps.entityDocument,
      ownProps.propertyName,
      ownProps.propertyID
    ),
  ownProps,
  stateProps,
});

const connector = connect(mapStateToProps, mapDispatchToProps, mergeProps);

type mappedProps = ConnectedProps<typeof connector>;

const DeleteSelectionButtonComponent = ({ onClickFunction, ownProps, stateProps }: mappedProps) => {
  const property = ownProps.propertyName === 'title' ? 'title' : ownProps.propertyID;

  const selections = uniqBy(
    [
      ...(stateProps.newSelections?.toJS() || []),
      ...(stateProps.entityDocument?.get('extractedMetadata')?.toJS() || []),
    ],
    'propertyID'
  );

  const hasSelections = property ? checkPropertySelections(property, selections) : false;

  if (!hasSelections || !hasSelections.length) {
    return null;
  }

  return (
    <button type="button" className="delete-selection" onClick={onClickFunction}>
      <Translate translationKey="Clear PDF selection">Clear PDF selection</Translate>
    </button>
  );
};

const container = connector(DeleteSelectionButtonComponent);

export { container as DeleteSelectionButton };

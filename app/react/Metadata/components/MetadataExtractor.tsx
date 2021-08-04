import React, { useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { Icon } from 'app/UI';
import { IStore } from 'app/istore';
import { actions } from 'app/BasicReducer';

export type OwnPropTypes = {
  fieldName: string;
  fieldId: string;
  model: string;
};

const selectionHandler = (selection: {}, fieldName: string, fieldId: string) =>
  actions.updateIn('documentViewer.metadataExtraction', ['selections'], {
    _id: fieldId,
    label: fieldName,
    timestamp: Date(),
    selection,
  });

const formFieldUpdater = (value: string, model: string) => formActions.change(model, value);

const mapStateToProps = (state: IStore, ownProps: OwnPropTypes) => {
  const { fieldName } = ownProps;
  return {
    selection: state.documentViewer.uiState.get('reference').get('sourceRange'),
    isActive: state.documentViewer.metadataExtraction.get('active') === fieldName,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: OwnPropTypes) => {
  const { fieldName, fieldId, model } = ownProps;
  return bindActionCreators(
    {
      setActive: () => actions.setIn('documentViewer.metadataExtraction', 'active', fieldName),
      unsetActive: () => actions.setIn('documentViewer.metadataExtraction', 'active', 'none'),
      setSelection: selection => selectionHandler(selection, fieldName, fieldId),
      updateFormField: value => formFieldUpdater(value, model),
    },
    dispatch
  );
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const MetadataExtractorComponent = ({
  selection,
  isActive,
  setActive,
  unsetActive,
  setSelection,
  updateFormField,
}: mappedProps) => {
  useEffect(() => {
    if (isActive && selection !== null) {
      setSelection(selection);
      updateFormField(selection.text);
      unsetActive();
    }
  }, [isActive, selection]);

  const onClick = () => {
    if (!isActive) {
      return setActive();
    }
    return unsetActive();
  };

  return (
    <button type="button" onClick={onClick}>
      {isActive && <p>Select to fill</p>} <Icon icon="link" />
    </button>
  );
};

const container = connector(MetadataExtractorComponent);
export { container as MetadataExtractor };

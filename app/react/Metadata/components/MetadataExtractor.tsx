import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { Icon } from 'app/UI';
import { IStore } from 'app/istore';
import { selectionHandler, formFieldUpdater } from '../actions/metadataExtractionActions';

export type OwnPropTypes = {
  fieldName: string;
  model: string;
  fieldId?: string;
};

const mapStateToProps = (state: IStore) => ({
  selection: state.documentViewer.uiState.get('reference').get('sourceRange'),
});

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: OwnPropTypes) => {
  const { fieldName, fieldId, model } = ownProps;
  return bindActionCreators(
    {
      updateFormField: value => formFieldUpdater(value, model),
      setSelection: selection => selectionHandler(selection, fieldName, fieldId),
    },
    dispatch
  );
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const MetadataExtractorComponent = ({ selection, setSelection, updateFormField }: mappedProps) => {
  const onClick = () => {
    setSelection(selection);
    updateFormField(selection.text);
  };

  if (selection !== null) {
    return (
      <button type="button" onClick={onClick}>
        <p>
          Click to fill
          <Icon icon="link" />
        </p>
      </button>
    );
  }
  return null;
};

const container = connector(MetadataExtractorComponent);
export { container as MetadataExtractor };

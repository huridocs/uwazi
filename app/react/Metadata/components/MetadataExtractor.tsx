import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { Icon } from 'app/UI';
import { IStore } from 'app/istore';
import { updateSelection, updateFormField } from '../actions/metadataExtractionActions';

export type OwnPropTypes = {
  fieldName: string;
  model: string;
  fieldId?: string;
  fieldType?: string;
};

type selection = {
  text: string;
  selectionRectangle: [];
};

const mapStateToProps = (state: IStore) => ({
  selection: (state.documentViewer.uiState
    .get('reference')
    .get('sourceRange') as unknown) as selection,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: OwnPropTypes) => {
  const { fieldName, fieldId, model, fieldType = undefined } = ownProps;
  return bindActionCreators(
    {
      updateField: value => updateFormField(value, model, fieldType),
      setSelection: selection => updateSelection(selection, fieldName, fieldId, fieldType),
    },
    dispatch
  );
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const MetadataExtractorComponent = ({ selection, setSelection, updateField }: mappedProps) => {
  const onClick = () => {
    setSelection(selection);
    updateField(selection.text);
  };

  if (selection !== null) {
    return (
      <button type="button" onClick={onClick} className="extraction-button">
        <span>
          Click to fill <Icon icon="bullseye" />
        </span>
      </button>
    );
  }
  return null;
};

const container = connector(MetadataExtractorComponent);
export { container as MetadataExtractor };

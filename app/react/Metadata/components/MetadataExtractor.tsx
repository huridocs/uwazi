import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { Icon } from 'app/UI';
import { IStore } from 'app/istore';
import { Translate } from 'app/I18N';
import { updateSelection, updateFormField } from '../actions/metadataExtractionActions';

export type OwnPropTypes = {
  fieldName: string;
  model: string;
  fieldId?: string;
  fieldType?: string;
  locale?: string;
};

type selection = {
  text: string;
  selectionRectangle: [];
};

const mapStateToProps = (state: IStore) => ({
  selection: state.documentViewer.uiState
    .get('reference')
    .get('sourceRange') as unknown as selection,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: OwnPropTypes) => {
  const { fieldName, fieldId, model, fieldType, locale } = ownProps;
  return bindActionCreators(
    {
      updateField: value => async (dis: Dispatch<{}>) => {
        const action = await updateFormField(value, model, fieldType, locale);
        dis(action);
      },
      setSelection: selection => updateSelection(selection, fieldName, fieldId),
    },
    dispatch
  );
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const MetadataExtractorComponent = ({ selection, setSelection, updateField }: mappedProps) => {
  const onClick = async () => {
    setSelection(selection);
    updateField(selection.text);
  };

  if (selection !== null) {
    return (
      <button type="button" onClick={onClick} className="extraction-button">
        <span>
          <Translate>Click to fill</Translate> <Icon icon="bullseye" />
        </span>
      </button>
    );
  }
  return null;
};

const container = connector(MetadataExtractorComponent);
export { container as MetadataExtractor };

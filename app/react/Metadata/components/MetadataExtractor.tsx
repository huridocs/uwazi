import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { ModelAction } from 'react-redux-form';

import { t, Translate } from '#app/I18N/index.js';

import { notificationActions } from '#app/Notifications/index.js';

import { SelectionRectanglesSchema } from '#shared/types/commonTypes.js';
import { updateSelection, updateFormField } from '../actions/metadataExtractionActions';
import { IStore } from '#app/istore.js';
import { Icon } from '#app/V2/Components/UI/index.js';

type OwnPropTypes = {
  fieldName: string;
  model: string;
  fieldId?: string;
  fieldType?: string;
  locale?: string;
};

type Selection = {
  text: string;
  selectionRectangles: SelectionRectanglesSchema;
};

const mapStateToProps = (state: IStore) => ({
  selection: state.documentViewer.uiState
    .get('reference')
    .get('sourceRange') as unknown as Selection,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: OwnPropTypes) => {
  const { fieldName, fieldId, model, fieldType, locale } = ownProps;
  return bindActionCreators(
    {
      updateField: value => async (dis: Dispatch<{}>) => {
        const action = await updateFormField(value, model, fieldType, locale);
        dis(action as ModelAction);
      },
      setSelection: selection => updateSelection(selection, fieldName, fieldId),
      notify: notificationActions.notify,
    },
    dispatch
  );
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const MetadataExtractorComponent = ({
  selection,
  setSelection,
  updateField,
  notify,
}: mappedProps) => {
  const onClick = async () => {
    if (!selection.selectionRectangles?.length) {
      notify(
        t('System', 'Could not detect the area for the selected text', null, false),
        'warning'
      );
    }

    setSelection(selection);

    updateField(selection.text);
  };

  if (!selection) {
    return null;
  }

  return (
    <button type="button" onClick={onClick} className="extraction-button">
      <span>
        <Translate>Click to fill</Translate> <Icon icon="bullseye" />
      </span>
    </button>
  );
};

const container = connector(MetadataExtractorComponent);

export type { Selection };
export { container as MetadataExtractor };

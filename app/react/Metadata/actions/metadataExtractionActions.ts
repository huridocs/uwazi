import { Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
import { IImmutable } from 'shared/types/Immutable';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import { actions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import { t } from 'app/I18N';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientFile } from 'app/istore';

const updateSelection = (
  selection: { text: string; selectionRectangles: any[] },
  fieldName: string,
  fieldId?: string
) => {
  const selected = { ...selection };

  const data = {
    ...(fieldId && { propertyID: fieldId }),
    name: fieldName,
    timestamp: Date(),
    selection: selected,
  };

  return actions.updateIn('documentViewer.metadataExtraction', ['selections'], data, 'propertyID');
};

const deleteSelection =
  (entityDocument: IImmutable<ClientFile> | undefined, propertyName: string, propertyID?: string) =>
  (dispatch: Dispatch<{}>) => {
    const document = entityDocument?.toJS();

    const updatedSelections = document?.extractedMetadata?.filter(
      selection =>
        (propertyName === 'title' && selection.name !== 'title') ||
        selection.propertyID !== propertyID
    );

    const data = {
      ...(propertyID && { propertyID }),
      name: propertyName,
      selection: { text: '', selectionRectangles: [] },
      deleteSelection: true,
    };

    return [
      dispatch(
        actions.setIn('viewer/doc', 'defaultDoc', {
          ...document,
          extractedMetadata: updatedSelections,
        })
      ),
      dispatch(
        actions.updateIn('documentViewer.metadataExtraction', ['selections'], data, 'propertyID')
      ),
    ];
  };

const updateFormField = async (
  value: string,
  model: string,
  fieldType?: string,
  locale?: string
) => {
  if (fieldType === 'date') {
    const requestParams = new RequestParams({
      locale,
      value,
      type: 'date',
    });
    const { value: coercedValue, success } = await entitiesAPI.coerceValue(requestParams);
    if (!success) {
      return notificationActions.notify(
        t('System', 'Value cannot be transformed to date', null, false),
        'danger'
      );
    }
    return formActions.change(model, coercedValue);
  }

  if (fieldType === 'numeric' && Number.isNaN(Number.parseInt(value, 10))) {
    return formActions.change(model, '0');
  }

  return formActions.change(model, value);
};

export { updateSelection, updateFormField, deleteSelection };

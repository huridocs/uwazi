import { Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/Immutable.j... Remove this comment to see the full error message
import { IImmutable } from 'shared/types/Immutable.js';
import entitiesAPI from '../../Entities/EntitiesAPI.js';
import { actions } from '../../BasicReducer/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../Notifications.js' or its... Remove this comment to see the full error message
import { notificationActions } from '../../Notifications.js';
import { t } from '../../I18N/index.js';
import { RequestParams } from '../../utils/RequestParams.js';
import { ClientFile } from '../../istore.js';

const getAndUpdateCoercedValue = async (params: RequestParams, model: string) => {
  const { value: coercedValue, success } = await entitiesAPI.coerceValue(params);
  if (!success) {
    return notificationActions.notify(
      t('System', 'Value cannot be transformed to the correct type', null, false),
      'danger'
    );
  }
  return formActions.change(model, coercedValue);
};

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
      // @ts-expect-error TS(7006): Parameter 'selection' implicitly has an 'any' type... Remove this comment to see the full error message
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
    return getAndUpdateCoercedValue(requestParams, model);
  }

  if (fieldType === 'numeric') {
    const requestParams = new RequestParams({
      locale,
      value: value.trim(),
      type: 'numeric',
    });
    return getAndUpdateCoercedValue(requestParams, model);
  }

  const requestParams = new RequestParams({
    locale,
    value,
    type: 'text',
  });
  return getAndUpdateCoercedValue(requestParams, model);
};

export { updateSelection, updateFormField, deleteSelection };

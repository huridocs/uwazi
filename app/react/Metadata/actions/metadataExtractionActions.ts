import { actions as formActions } from 'react-redux-form';
import { dateToSeconds } from 'app/utils/dateAPI';
import { actions } from 'app/BasicReducer';
import { Dispatch } from 'redux';

const updateSelection = (
  selection: { [key: string]: string },
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

const updateFormField =
  (value: string, model: string, fieldType?: string, locale?: string) =>
  async (dispatch: Dispatch<{}>) => {
    if (fieldType === 'date') {
      const { date } = await dateToSeconds(value, locale);
      return dispatch(formActions.change(model, date));
    }

    if (fieldType === 'numeric' && Number.isNaN(Number.parseInt(value, 10))) {
      return dispatch(formActions.change(model, '0'));
    }

    return dispatch(formActions.change(model, value));
  };

export { updateSelection, updateFormField };

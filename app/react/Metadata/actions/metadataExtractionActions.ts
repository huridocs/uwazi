import { actions as formActions } from 'react-redux-form';
import { dateToSeconds } from 'shared/dataUtils';
import { actions } from 'app/BasicReducer';

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

const updateFormField = (value: string, model: string, fieldType?: string) => {
  if (fieldType === 'date') {
    const dateForPicker = dateToSeconds(value);
    return formActions.change(model, dateForPicker);
  }

  if (fieldType === 'numeric' && Number.isNaN(Number.parseInt(value, 10))) {
    return formActions.change(model, '0');
  }

  return formActions.change(model, value);
};

export { updateSelection, updateFormField };

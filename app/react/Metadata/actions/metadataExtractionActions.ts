import { actions } from 'app/BasicReducer';
import moment from 'moment';
import { actions as formActions } from 'react-redux-form';

const updateSelection = (selection: {}, fieldName: string, fieldId?: string) => {
  const data = {
    ...(fieldId && { _id: fieldId }),
    label: fieldName,
    timestamp: Date(),
    selection,
  };
  return actions.updateIn('documentViewer.metadataExtraction', ['selections'], data);
};

const formFieldUpdater = (value: string, model: string, fieldType?: string) => {
  if (fieldType === 'date') {
    const dateFormats = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD', 'YYYY'];
    const getDate = moment.utc(value, dateFormats).format('x');
    const dateForPicker = parseInt(getDate, 10) / 1000;
    return formActions.change(model, dateForPicker);
  }

  return formActions.change(model, value);
};

export { updateSelection, formFieldUpdater };

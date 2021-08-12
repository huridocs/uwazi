import moment from 'moment';
import { actions as formActions } from 'react-redux-form';
import { actions } from 'app/BasicReducer';

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
    let getDate = Date.parse(`${value} GMT`);
    if (Number.isNaN(getDate)) {
      const dateFormats = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD', 'YYYY'];
      const momentDate = moment.parseZone(value, dateFormats).format('x');
      getDate = parseInt(momentDate, 10);
    }
    const dateForPicker = getDate / 1000;
    return formActions.change(model, dateForPicker);
  }

  return formActions.change(model, value);
};

export { updateSelection, formFieldUpdater };

import moment from 'moment';
import { actions as formActions } from 'react-redux-form';
import { actions } from 'app/BasicReducer';

const dateToMilliseconds = (value: string) => {
  let getDate = Date.parse(`${value} GMT`);
  if (Number.isNaN(getDate)) {
    const momentDate = moment
      .parseZone(value, ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD', 'YYYY'])
      .format('x');
    getDate = parseInt(momentDate, 10);
  }
  const formattedDate = getDate / 1000;
  return formattedDate;
};

const updateSelection = (
  selection: { [key: string]: string },
  fieldName: string,
  fieldId?: string,
  fieldType?: string
) => {
  const selected = { ...selection };
  if (fieldType === 'date') {
    selected.text = dateToMilliseconds(selection.text).toString();
  }
  const data = {
    ...(fieldId && { _id: fieldId }),
    name: fieldName,
    timestamp: Date(),
    selection: selected,
  };
  return actions.updateIn('documentViewer.metadataExtraction', ['selections'], data);
};

const formFieldUpdater = (value: string, model: string, fieldType?: string) => {
  if (fieldType === 'date') {
    const dateForPicker = dateToMilliseconds(value);
    return formActions.change(model, dateForPicker);
  }

  if (fieldType === 'numeric' && Number.isNaN(Number.parseInt(value, 10))) {
    return formActions.change(model, '0');
  }

  return formActions.change(model, value);
};

export { updateSelection, formFieldUpdater };

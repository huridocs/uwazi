import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';

const selectionHandler = (selection: {}, fieldName: string, fieldId?: string) => {
  const data = {
    ...(fieldId && { _id: fieldId }),
    label: fieldName,
    timestamp: Date(),
    selection,
  };
  return actions.updateIn('documentViewer.metadataExtraction', ['selections'], data);
};

const formFieldUpdater = (value: string, model: string) => formActions.change(model, value);

export { selectionHandler, formFieldUpdater };

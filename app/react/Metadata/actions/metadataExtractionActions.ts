import moment from 'moment';
import { actions as formActions } from 'react-redux-form';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { store } from 'app/store';
import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

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

const getSelections = () => {
  const state = store?.getState();
  return state ? state.documentViewer.metadataExtraction.get('selections').toJS() : [];
};

const saveSelections = async (doc: EntityWithFilesSchema) => {
  const selections = getSelections();

  if (selections.length > 0) {
    const mainDocument = await api.get(
      'files',
      new RequestParams({ entity: doc.sharedId, type: 'document' })
    );
    return api.post(
      'files',
      new RequestParams({ extractedMetadata: selections, _id: mainDocument.json[0]._id })
    );
  }

  return null;
};

export { updateSelection, formFieldUpdater, saveSelections };

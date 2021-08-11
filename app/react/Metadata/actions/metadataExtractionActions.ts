import moment from 'moment';
import { actions as formActions } from 'react-redux-form';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { store } from 'app/store';
import { actions } from 'app/BasicReducer';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

const mergeByProperty = (a: any[], b: any[], p: string) =>
  a.filter(aa => !b.find(bb => aa[p] === bb[p])).concat(b);

const checkSelections = (storeSelections = [], file: FileType, entity: EntitySchema) => {
  let selections;

  if (file.extractedMetadata) {
    selections = mergeByProperty(file.extractedMetadata, storeSelections, 'label');
    return selections;
  }

  selections = storeSelections;
  return selections;
};

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

const saveSelections = async (entity: EntitySchema) => {
  const { selections: storeSelections } = store
    ? store.getState().documentViewer.metadataExtraction.toJS()
    : { selections: [] };

  const mainDocument = await api.get(
    'files',
    new RequestParams({ entity: entity.sharedId, type: 'document' })
  );

  if (storeSelections.length > 0) {
    const selections = checkSelections(storeSelections, mainDocument.json[0], entity);
    return api.post(
      'files',
      new RequestParams({ extractedMetadata: selections, _id: mainDocument.json[0]._id })
    );
  }

  return null;
};

export { updateSelection, formFieldUpdater, saveSelections };

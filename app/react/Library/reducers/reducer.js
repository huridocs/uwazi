import {combineReducers} from 'redux';

import documents from './documentsReducer';
import libraryUI from './uiReducer';
import libraryFilters from './filtersReducer';
import createReducer from 'app/BasicReducer';
import {multireducer} from 'app/Multireducer';

import {modelReducer, formReducer} from 'react-redux-form';

export default (storeKey) => {
  return combineReducers({
    aggregations: multireducer(createReducer('aggregations', {}), storeKey),
    documents: multireducer(documents, storeKey),
    ui: multireducer(libraryUI, storeKey),
    filters: multireducer(libraryFilters, storeKey),
    //
    sidepanel: combineReducers({
      metadata: modelReducer(storeKey + '.sidepanel.metadata', {}),
      metadataForm: formReducer(storeKey + '.sidepanel.metadata', {}),
      multipleEdit: modelReducer(storeKey + '.sidepanel.multipleEdit', {}),
      multipleEditForm: formReducer(storeKey + '.sidepanel.multipleEdit', {}),
      references: createReducer(storeKey + '.sidepanel.references', []),
      tab: createReducer(storeKey + '.sidepanel.tab', '')
    })
  });
};

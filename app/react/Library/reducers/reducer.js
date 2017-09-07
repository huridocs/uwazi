import {combineReducers} from 'redux';
import Immutable from 'immutable';
import documents from './documentsReducer';
import libraryUI from './uiReducer';
import libraryFilters from './filtersReducer';
import aggregationsReducer from './aggregationsReducer';
import createReducer from 'app/BasicReducer';
import {multireducer} from 'app/Multireducer';
import {isClient} from 'app/utils';

import {modelReducer, formReducer} from 'react-redux-form';
import manageAttachmentsReducer from 'app/Attachments/reducers/manageAttachmentsReducer';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

let templates = null;
if (isClient) {
  templates = window.__reduxData__ && window.__reduxData__.templates ? Immutable.fromJS(window.__reduxData__.templates) : null;
}

const defaultSearch = prioritySortingCriteria.get({templates});
defaultSearch.searchTerm = '';
defaultSearch.filters = {};

export default (storeKey) => {
  return combineReducers({
    aggregations: multireducer(aggregationsReducer, storeKey),
    documents: multireducer(documents, storeKey),
    ui: multireducer(manageAttachmentsReducer(libraryUI, {useDefaults: false, setInArray: ['selectedDocuments', 0]}), storeKey),
    filters: multireducer(libraryFilters, storeKey),
    search: modelReducer(storeKey + '.search', defaultSearch),
    searchForm: formReducer(storeKey + '.search', defaultSearch),
    selectedSorting: createReducer(storeKey + '.selectedSorting', {}),
    //
    sidepanel: combineReducers({
      metadata: modelReducer(storeKey + '.sidepanel.metadata', {}),
      metadataForm: formReducer(storeKey + '.sidepanel.metadata', {}),
      multipleEdit: modelReducer(storeKey + '.sidepanel.multipleEdit', {}),
      multipleEditForm: formReducer(storeKey + '.sidepanel.multipleEdit', {}),
      references: createReducer(storeKey + '.sidepanel.references', []),
      snippets: createReducer(storeKey + '.sidepanel.snippets', []),
      tab: createReducer(storeKey + '.sidepanel.tab', '')
    })
  });
};

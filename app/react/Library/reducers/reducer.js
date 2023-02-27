import { combineReducers } from 'redux';
import Immutable from 'immutable';
import createReducer from 'app/BasicReducer';
import { multireducer } from 'app/Multireducer';
import { isClient } from 'app/utils';

import { modelReducer, formReducer } from 'react-redux-form';
import { manageAttachmentsReducer } from 'app/Attachments';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import { documentsReducer } from './documentsReducer';
import libraryUI from './uiReducer';
import libraryFilters from './filtersReducer';
import aggregationsReducer from './aggregationsReducer';

let templates = null;
if (isClient) {
  templates =
    window.__reduxData__ && window.__reduxData__.templates
      ? Immutable.fromJS(window.__reduxData__.templates)
      : null;
}

const defaultSearch = prioritySortingCriteria.get({ templates });
defaultSearch.searchTerm = '';
defaultSearch.filters = {};
defaultSearch.allAggregations = true;
defaultSearch.includeUnpublished = true;
defaultSearch.publishedStatus = { values: ['published', 'restricted'] };

export default storeKey =>
  combineReducers({
    aggregations: multireducer(aggregationsReducer, storeKey),
    documents: multireducer(documentsReducer, storeKey),
    ui: multireducer(
      manageAttachmentsReducer(libraryUI, {
        useDefaults: false,
        setInArray: ['selectedDocuments', 0],
      }),
      storeKey
    ),
    filters: multireducer(libraryFilters, storeKey),
    search: modelReducer(`${storeKey}.search`, defaultSearch),
    searchForm: formReducer(`${storeKey}.search`, defaultSearch),
    selectedSorting: createReducer(`${storeKey}.selectedSorting`, {}),
    markers: createReducer(`${storeKey}.markers`, { rows: [] }),
    //
    sidepanel: combineReducers({
      metadata: modelReducer(`${storeKey}.sidepanel.metadata`, {}),
      metadataForm: formReducer(`${storeKey}.sidepanel.metadata`, {}),
      multipleEdit: modelReducer(`${storeKey}.sidepanel.multipleEdit`, {}),
      multipleEditForm: formReducer(`${storeKey}.sidepanel.multipleEdit`, {}),
      quickLabelState: createReducer(`${storeKey}.sidepanel.quickLabelState`, {}),
      quickLabelMetadata: modelReducer(`${storeKey}.sidepanel.quickLabelMetadata`, {}),
      quickLabelMetadataForm: formReducer(`${storeKey}.sidepanel.quickLabelMetadata`, {}),
      references: createReducer(`${storeKey}.sidepanel.references`, []),
      snippets: createReducer(`${storeKey}.sidepanel.snippets`, {
        count: 0,
        metadata: [],
        fullText: [],
      }),
      tab: createReducer(`${storeKey}.sidepanel.tab`, ''),
      view: createReducer(`${storeKey}.sidepanel.view`, ''),
    }),
  });

import React from 'react';
import Helmet from 'react-helmet';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import {enterLibrary, setDocuments} from 'app/Library/actions/libraryActions';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import SearchButton from 'app/Library/components/SearchButton';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import {t} from 'app/I18N';
import {wrapDispatch} from 'app/Multireducer';

import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsHeader from 'app/Uploads/components/UploadsHeader';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default class Uploads extends RouteHandler {

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="library"/>
      </div>
    );
  }

  static requestState(params, query = {filters: {}, types: []}, globalResources) {
    const defaultSearch = prioritySortingCriteria.get();

    query.order = query.order || defaultSearch.order;
    query.sort = query.sort || defaultSearch.sort;
    query.unpublished = true;

    return api.search(query)
    .then((documents) => {
      const filterState = libraryHelpers.URLQueryToState(query, globalResources.templates.toJS(), globalResources.thesauris.toJS());
      return {
        uploads: {
          documents,
          filters: {documentTypes: query.types || [], properties: filterState.properties},
          aggregations: documents.aggregations,
          search: filterState.search
        }
      };
    });
  }

  setReduxState(state) {
    const dispatch = wrapDispatch(this.context.store.dispatch, 'uploads');
    dispatch(setDocuments(state.uploads.documents));
    dispatch(actions.set('aggregations', state.uploads.aggregations));
    dispatch(formActions.load('uploads.search', state.uploads.search));
    dispatch({type: 'SET_LIBRARY_FILTERS',
                                documentTypes: state.uploads.filters.documentTypes,
                                libraryFilters: state.uploads.filters.properties}
                               );
  }

  componentDidMount() {
    const dispatch = wrapDispatch(this.context.store.dispatch, 'uploads');
    dispatch(enterLibrary());
  }

  render() {
    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Uploads')} />
        <UploadsHeader/>
        <main className="document-viewer with-panel">
          <UploadBox />
          <DocumentsList storeKey="uploads"/>
        </main>
        <LibraryFilters uploadsSection={true} storeKey="uploads"/>
        <ViewMetadataPanel storeKey="uploads"/>
        <SelectMultiplePanelContainer storeKey="uploads"/>
      </div>
    );
  }
}

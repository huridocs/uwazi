import React from 'react';
import Helmet from 'react-helmet';
import Immutable from 'immutable';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import {enterLibrary, setDocuments, unselectAllDocuments} from 'app/Library/actions/libraryActions';
import libraryHelpers from 'app/Library/helpers/libraryFilters';
import SearchButton from 'app/Library/components/SearchButton';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import ConfirmCloseForm from 'app/Library/components/ConfirmCloseForm';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import {t} from 'app/I18N';
import {store} from 'app/store';

import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsHeader from 'app/Uploads/components/UploadsHeader';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default class Uploads extends RouteHandler {

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton/>
      </div>
    );
  }

  static requestState(params, query = {filters: {}, types: []}) {
    const defaultSearch = prioritySortingCriteria.get();

    query.order = query.order || defaultSearch.order;
    query.sort = query.sort || defaultSearch.sort;
    query.unpublished = true;

    return api.search(query)
    .then((documents) => {
      const state = store.getState();
      const filterState = libraryHelpers.URLQueryToState(query, state.templates.toJS(), state.thesauris.toJS());
      return {
        library: {
          documents,
          filters: {documentTypes: query.types || [], properties: filterState.properties},
          aggregations: documents.aggregations
        },
        search: filterState.search
      };
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(setDocuments(state.library.documents));
    this.context.store.dispatch(actions.set('library/aggregations', state.library.aggregations));
    this.context.store.dispatch(formActions.load('search', state.search));
    this.context.store.dispatch({type: 'SET_LIBRARY_FILTERS',
                                documentTypes: state.library.filters.documentTypes,
                                libraryFilters: state.library.filters.properties}
                               );
  }

  componentDidMount() {
    this.context.store.dispatch(enterLibrary());
  }

  componentWillUnmount() {
    this.context.store.dispatch(setDocuments(Immutable.fromJS({rows: []})));
    this.context.store.dispatch(unselectAllDocuments());
  }

  render() {
    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Uploads')} />
        <UploadsHeader/>
        <main className="document-viewer with-panel">
          <UploadBox />
          <DocumentsList />
        </main>
        <ConfirmCloseForm />
        <LibraryFilters uploadsSection={true}/>
        <ViewMetadataPanel />
        <SelectMultiplePanelContainer />
      </div>
    );
  }
}

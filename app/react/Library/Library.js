import React from 'react';
import Helmet from 'react-helmet';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from './components/DocumentsList';
import LibraryFilters from './components/LibraryFilters';
import {enterLibrary, setDocuments} from './actions/libraryActions';
import libraryHelpers from './helpers/libraryFilters';
import SearchButton from './components/SearchButton';
import ViewMetadataPanel from './components/ViewMetadataPanel';
import ConfirmCloseForm from './components/ConfirmCloseForm';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';
import {t} from 'app/I18N';
import {store} from 'app/store';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default class Library extends RouteHandler {

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

  render() {
    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library')} />
        <DocumentsList />
        <ConfirmCloseForm />
        <LibraryFilters />
        <ViewMetadataPanel />
      </div>
    );
  }
}

import React from 'react';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from './components/DocumentsList';
import LibraryFilters from './components/LibraryFilters';
import {enterLibrary, setDocuments} from './actions/libraryActions';
import libraryHelpers from './helpers/libraryFilters';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import SearchBar from './components/SearchBar';
import SearchButton from './components/SearchButton';
import ViewMetadataPanel from './components/ViewMetadataPanel';
import ConfirmCloseForm from './components/ConfirmCloseForm';
import {actions} from 'app/BasicReducer';
import {actions as formActions} from 'react-redux-form';

export default class Library extends RouteHandler {

  static renderTools() {
    return <div>
        <SearchBar/>
        <SearchButton/>
      </div>;
  }

  static requestState(params, query = {filters: {}, types: []}) {
    query.order = query.order || 'desc';
    query.sort = query.sort || 'title.raw';
    return Promise.all([api.search(query), templatesAPI.get(), thesaurisAPI.get()])
    .then(([documents, templates, thesauris]) => {
      const filterState = libraryHelpers.URLQueryToState(query, templates, thesauris);

      return {
        library: {
          documents,
          filters: {documentTypes: query.types || [], properties: filterState.properties},
          aggregations: documents.aggregations
        },
        search: filterState.search,
        templates,
        thesauris
      };
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(setDocuments(state.library.documents));
    this.context.store.dispatch(actions.set('templates', state.templates));
    this.context.store.dispatch(actions.set('thesauris', state.thesauris));
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
    return <div className="row panels-layout">
      <DocumentsList />
      <ConfirmCloseForm />
      <LibraryFilters />
      <ViewMetadataPanel />
    </div>;
  }
}

import React from 'react';

import api from 'app/Search/SearchAPI';
import RouteHandler from 'app/App/RouteHandler';
import DocumentsList from './components/DocumentsList';
import LibraryFilters from './components/LibraryFilters';
import {enterLibrary, setDocuments} from './actions/libraryActions';
import * as libraryHelpers from './helpers/libraryFilters';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import SearchBar from './components/SearchBar';
import SearchButton from './components/SearchButton';
import ViewMetadataPanel from './components/ViewMetadataPanel';
import ConfirmCloseForm from './components/ConfirmCloseForm';
//import {store} from 'app/store';
import {actions} from 'app/BasicReducer';

export default class Library extends RouteHandler {

  static renderTools() {
    return <div>
        <SearchBar/>
        <SearchButton/>
      </div>;
  }

  static requestState(params, query) {
    //test this
    query.filters = query.filters || {};
    if (typeof query.filters === 'string') {
      query.filters = JSON.parse(query.filters);
    }

    query.types = query.types || [];
    if (typeof query.types === 'string') {
      query.types = JSON.parse(query.types);
    }
    //

    return Promise.all([api.search(query), templatesAPI.get(), thesaurisAPI.get()])
    .then(([documents, templates, thesauris]) => {
      let properties = libraryHelpers.libraryFilters(templates, query.types);
      let {searchTerm, filters, order, sort} = query;
      Object.keys(filters).forEach(filter => {
        filters[filter] = filters[filter].value;
      });
      properties = libraryHelpers.populateOptions(properties, thesauris).map((property) => {
        if (filters[property.name]) {
          property.active = true;
        }
        return property;
      });

      return {
        library: {
          documents,
          filters: {documentTypes: query.types, properties},
          aggregations: documents.aggregations
        },
        search: {searchTerm, filters, order, sort},
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

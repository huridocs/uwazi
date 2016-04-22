import React from 'react';

import RouteHandler from 'app/controllers/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import {setDocuments, setTemplates} from 'app/Library/actions/libraryActions';
import documentsAPI from 'app/Library/DocumentsAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import SearchBar from 'app/Library/components/SearchBar';

export default class Library extends RouteHandler {

  static renderTools() {
    return <SearchBar/>;
  }

  static requestState() {
    return Promise.all([documentsAPI.search(), templatesAPI.get()])
    .then((results) => {
      return {
        library: {documents: results[0],
        filters: {templates: results[1], suggestions: []}}
      };
    });
  }

  setReduxState({library}) {
    this.context.store.dispatch(setDocuments(library.documents));
    this.context.store.dispatch(setTemplates(library.filters.templates));
  }

  render() {
    return <div className="row panels-layout">
              <DocumentsList />
              <LibraryFilters />
            </div>;
  }
}

//when all components are integrated with redux we can remove this
Library.__redux = true;

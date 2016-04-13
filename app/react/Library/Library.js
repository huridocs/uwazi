import React from 'react';

import RouteHandler from 'app/controllers/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import {setDocuments} from 'app/Library/actions/libraryActions';
import api from 'app/Library/DocumentsAPI';
import SearchBar from 'app/Library/components/SearchBar';

export default class Library extends RouteHandler {

  static renderTools() {
    return <SearchBar/>;
  }

  static requestState() {
    return api.search()
    .then((documents) => {
      return {library: {documents}};
    });
  }

  setReduxState({library}) {
    this.context.store.dispatch(setDocuments(library.documents));
  }

  render() {
    return <DocumentsList />;
  }
}

//when all components are integrated with redux we can remove this
Library.__redux = true;

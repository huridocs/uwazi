import React from 'react';
import Immutable from 'immutable';

import RouteHandler from 'app/controllers/App/RouteHandler';
import DocumentsList from 'app/Library/components/DocumentsList';
import {setDocuments} from 'app/Library/actions/libraryActions';
import api from 'app/Library/DocumentsAPI';

export default class Library extends RouteHandler {

  static requestState() {
    return api.get()
    .then((documents) => {
      return {documents: Immutable.fromJS(documents)};
    });
  }

  setReduxState({documents}) {
    this.context.store.dispatch(setDocuments(documents));
  }

  render() {
    return <DocumentsList />;
  }
}

//when all components are integrated with redux we can remove this
Library.__redux = true;

import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import {setUploads} from 'app/Uploads/actions/uploadsActions';
import searchAPI from 'app/Search/SearchAPI';

import UploadsSection from 'app/Uploads/components/UploadsSection';

export default class UploadsRoute extends RouteHandler {

  static requestState() {
    return searchAPI.unpublished()
    .then((documents) => {
      return {uploads: {documents}};
    });
  }

  setReduxState({uploads: {documents}}) {
    this.context.store.dispatch(setUploads(documents));
  }

  render() {
    return <UploadsSection />;
  }
}

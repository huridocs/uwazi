import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import {setUploads} from 'app/Uploads/actions/uploadsActions';
import searchAPI from 'app/Search/SearchAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {actions} from 'app/BasicReducer';

import UploadsSection from 'app/Uploads/components/UploadsSection';

export default class UploadsRoute extends RouteHandler {

  static requestState() {
    return Promise.all([searchAPI.unpublished(), templatesAPI.get(), thesaurisAPI.get()])
    .then(([documents, templates, thesauris]) => {
      return {uploads: {documents}, templates, thesauris};
    });
  }

  setReduxState({uploads: {documents}, templates, thesauris}) {
    this.context.store.dispatch(setUploads(documents));
    this.context.store.dispatch(actions.set('templates', templates));
    this.context.store.dispatch(actions.set('thesauris', thesauris));
  }

  render() {
    return <UploadsSection />;
  }
}

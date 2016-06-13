import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import {setUploads, setTemplates, setThesauris} from 'app/Uploads/actions/uploadsActions';
import documentsAPI from 'app/Library/DocumentsAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';

import UploadsSection from 'app/Uploads/components/UploadsSection';

export default class UploadsRoute extends RouteHandler {

  static requestState() {
    return Promise.all([documentsAPI.uploads(), templatesAPI.get(), thesaurisAPI.get()])
    .then(([documents, templates, thesauris]) => {
      return {uploads: {documents, templates, thesauris}};
    });
  }

  setReduxState({uploads: {documents, templates, thesauris}}) {
    this.context.store.dispatch(setUploads(documents));
    this.context.store.dispatch(setTemplates(templates));
    this.context.store.dispatch(setThesauris(thesauris));
  }

  render() {
    return <UploadsSection />;
  }
}

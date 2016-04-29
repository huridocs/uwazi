import React from 'react';

import RouteHandler from 'app/controllers/App/RouteHandler';
import {setUploads, setTemplates, setThesauris} from 'app/Uploads/actions/uploadsActions';
import documentsAPI from 'app/Library/DocumentsAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';

import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsList from 'app/Uploads/components/UploadsList';

export default class Uploads extends RouteHandler {
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
    return (
      <main className="col-sm-8 col-sm-offset-2">
        <UploadBox />
        <UploadsList />
      </main>
    );
  }
}

//when all components are integrated with redux we can remove this
Uploads.__redux = true;

import React from 'react';

import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import RouteHandler from 'app/controllers/App/RouteHandler';
import {setReferences} from 'app/Viewer/actions/referencesActions';
import {setDocument} from 'app/Viewer/actions/documentActions';
import Viewer from 'app/Viewer/components/Viewer';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';

export default class ViewDocument extends RouteHandler {

  static requestState({documentId}) {
    return Promise.all([
      api.get('documents', {_id: documentId}),
      api.get('documents/html', {_id: documentId}),
      referencesAPI.get(documentId),
      templatesAPI.get(),
      thesaurisAPI.get()
    ])
    .then(([doc, docHTML, references, templates, thesauris]) => {
      return {
        documentViewer: {
          document: Object.assign({}, docHTML.json, doc.json.rows[0]),
          references,
          templates,
          thesauris
        }
      };
    });
  }

  setReduxState({documentViewer}) {
    this.context.store.dispatch(setDocument(documentViewer.document, null));
    this.context.store.dispatch(setReferences(documentViewer.references));
  }

  render() {
    return <Viewer />;
  }

}

//when all components are integrated with redux we can remove this
ViewDocument.__redux = true;

import React from 'react';

import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import RouteHandler from 'app/controllers/App/RouteHandler';
import {setReferences} from 'app/Viewer/actions/referencesActions';
import {setDocument} from 'app/Viewer/actions/documentActions';
import Viewer from 'app/Viewer/components/Viewer';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import {actions} from 'app/BasicReducer';

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
          doc: doc.json.rows[0],
          docHTML: docHTML.json,
          references,
          templates,
          thesauris
        }
      };
    });
  }

  setReduxState({documentViewer}) {
    this.context.store.dispatch(setReferences(documentViewer.references));
    this.context.store.dispatch(actions.set('viewer/doc', documentViewer.doc));
    this.context.store.dispatch(actions.set('viewer/docHTML', documentViewer.docHTML));
    this.context.store.dispatch(actions.set('viewer/templates', documentViewer.templates));
    this.context.store.dispatch(actions.set('viewer/thesauris', documentViewer.thesauris));
  }

  render() {
    return <Viewer />;
  }

}

//when all components are integrated with redux we can remove this
ViewDocument.__redux = true;

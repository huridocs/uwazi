import React from 'react';

import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import RouteHandler from 'app/App/RouteHandler';
import {setReferences} from 'app/Viewer/actions/referencesActions';
import Viewer from 'app/Viewer/components/Viewer';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import {actions} from 'app/BasicReducer';

export default class ViewDocument extends RouteHandler {

  static requestState({documentId}) {
    return Promise.all([
      api.get('documents', {_id: documentId}),
      api.get('documents/html', {_id: documentId}),
      referencesAPI.get(documentId),
      templatesAPI.get(),
      thesaurisAPI.get(),
      relationTypesAPI.get()
    ])
    .then(([doc, docHTML, references, templates, thesauris, relationTypes]) => {
      return {
        documentViewer: {
          doc: doc.json.rows[0],
          docHTML: docHTML.json,
          references,
          templates,
          thesauris,
          relationTypes
        }
      };
    });
  }

  setReduxState({documentViewer}) {
    this.context.store.dispatch(actions.set('viewer/doc', documentViewer.doc));
    this.context.store.dispatch(actions.set('viewer/docHTML', documentViewer.docHTML));
    this.context.store.dispatch(actions.set('viewer/templates', documentViewer.templates));
    this.context.store.dispatch(actions.set('viewer/thesauris', documentViewer.thesauris));
    this.context.store.dispatch(actions.set('viewer/relationTypes', documentViewer.relationTypes));
    this.context.store.dispatch(setReferences(documentViewer.references));
  }

  render() {
    return <Viewer />;
  }

}

//when all components are integrated with redux we can remove this
ViewDocument.__redux = true;

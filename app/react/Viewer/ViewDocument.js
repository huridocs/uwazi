import React from 'react';
import Immutable from 'immutable';

import api from 'app/utils/singleton_api';
import RouteHandler from 'app/controllers/App/RouteHandler';
import {setReferences} from 'app/Viewer/actions/referencesActions';
import {setDocument} from 'app/Viewer/actions/documentActions';
import Document from 'app/Viewer/components/Document';
import ContextMenu from 'app/ContextMenu';

export default class ViewDocument extends RouteHandler {

  static requestState({documentId}) {
    return Promise.all([
      api.get('documents?_id=' + documentId),
      api.get('references?sourceDocument=' + documentId)
    ])
    .then((response) => {
      return {
        documentViewer: {
          document: response[0].json.rows[0],
          references: Immutable.fromJS(response[1].json.rows)
        }
      };
    });
  }

  setReduxState({documentViewer}) {
    this.context.store.dispatch(setDocument(documentViewer.document));
    this.context.store.dispatch(setReferences(documentViewer.references));
  }

  render() {
    return (
      <main>
        <Document />
        <ContextMenu />
      </main>
    );
  }

}

//when all components are integrated with redux we can remove this
ViewDocument.__redux = true;

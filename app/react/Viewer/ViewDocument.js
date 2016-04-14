import React from 'react';

import api from 'app/utils/singleton_api';
import referencesAPI from 'app/Viewer/referencesAPI';
import RouteHandler from 'app/controllers/App/RouteHandler';
import {setReferences} from 'app/Viewer/actions/referencesActions';
import {setDocument} from 'app/Viewer/actions/documentActions';
import Viewer from 'app/Viewer/components/Viewer';

export default class ViewDocument extends RouteHandler {

  static requestState({documentId}) {
    return Promise.all([
      api.get('documents?_id=' + documentId),
      referencesAPI.get(documentId)
    ])
    .then((response) => {
      return {
        documentViewer: {
          document: response[0].json.rows[0],
          references: response[1]
        }
      };
    });
  }

  setReduxState({documentViewer}) {
    this.context.store.dispatch(setDocument(documentViewer.document));
    this.context.store.dispatch(setReferences(documentViewer.references));
  }

  render() {
    return <Viewer />;
  }

}

//when all components are integrated with redux we can remove this
ViewDocument.__redux = true;

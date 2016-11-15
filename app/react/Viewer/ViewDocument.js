import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import {setReferences} from 'app/Viewer/actions/referencesActions';
import Viewer from 'app/Viewer/components/Viewer';
import {actions} from 'app/BasicReducer';
import {PDFReady} from 'app/Viewer/actions/uiActions';
import {actions as formActions} from 'react-redux-form';

import {requestViewerState, setViewerState} from './actions/routeActions';

export default class ViewDocument extends RouteHandler {

  static requestState({documentId, lang}) {
    return requestViewerState(documentId, lang);
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('viewer/doc'));
    this.context.store.dispatch(actions.unset('viewer/templates'));
    this.context.store.dispatch(actions.unset('viewer/thesauris'));
    this.context.store.dispatch(actions.unset('viewer/relationTypes'));
    this.context.store.dispatch(formActions.reset('documentViewer.tocForm'));
    this.context.store.dispatch(actions.unset('viewer/targetDoc'));
    this.context.store.dispatch(setReferences([]));
    this.context.store.dispatch(PDFReady(false));
  }

  setReduxState(state) {
    this.context.store.dispatch(setViewerState(state));
  }

  render() {
    return <Viewer />;
  }
}

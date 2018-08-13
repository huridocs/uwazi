import { actions as formActions } from 'react-redux-form';
import React from 'react';

import { actions } from 'app/BasicReducer';
import { isClient } from 'app/utils';
import { setReferences } from 'app/Viewer/actions/referencesActions';
import RouteHandler from 'app/App/RouteHandler';
import Viewer from 'app/Viewer/components/Viewer';
import * as relationships from 'app/Relationships/utils/routeUtils';

import { requestViewerState, setViewerState } from './actions/routeActions';

class ViewDocument extends RouteHandler {
  constructor(props, context) {
    //Force client state even if is rendered from server to force the pdf character count process
    RouteHandler.renderedFromServer = props.renderedFromServer || false;
    //
    super(props, context);
  }

  static requestState(routeParams, query = {}, globalResources) {
    return requestViewerState({ ...routeParams, raw: query.raw || !isClient, page: query.page }, globalResources);
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillMount() {
    if (this.props.location.query.searchTerm) {
      this.context.store.dispatch(actions.set('viewer.sidepanel.tab', 'text-search'));
    }
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('viewer/doc'));
    this.context.store.dispatch(actions.unset('viewer/templates'));
    this.context.store.dispatch(actions.unset('viewer/thesauris'));
    this.context.store.dispatch(actions.unset('viewer/relationTypes'));
    this.context.store.dispatch(actions.unset('viewer/rawText'));
    this.context.store.dispatch(formActions.reset('documentViewer.tocForm'));
    this.context.store.dispatch(actions.unset('viewer/targetDoc'));
    this.context.store.dispatch(setReferences([]));
    this.context.store.dispatch(relationships.emptyState());
  }

  setReduxState(state) {
    this.context.store.dispatch(setViewerState(state));
  }

  render() {
    const { query = {} } = this.props.location;
    return (
      <Viewer
        raw={query.raw || !isClient}
        page={Number(this.props.location.query.page || 1)}
        searchTerm={this.props.location.query.searchTerm}
      />
    );
  }
}

ViewDocument.defaultProps = {
  params: {}
};

export default ViewDocument;

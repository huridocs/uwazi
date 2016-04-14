import React, {Component, PropTypes} from 'react';

import {loadDefaultViewerMenu, resetDocumentViewer} from 'app/Viewer/actions/documentActions';
import Document from 'app/Viewer/components/Document';
import CreateReferencePanel from 'app/Viewer/components/CreateReferencePanel';
import ContextMenu from 'app/ContextMenu/components/ContextMenu';

export default class Viewer extends Component {

  componentDidMount() {
    this.context.store.dispatch(loadDefaultViewerMenu());
  }

  componentWillUnmount() {
    this.context.store.dispatch(resetDocumentViewer());
  }

  render() {
    return (
      <main>
        <Document />
        <CreateReferencePanel />
        <ContextMenu />
      </main>
    );
  }

}

Viewer.contextTypes = {
  store: PropTypes.object
};

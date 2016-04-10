import React, {Component, PropTypes} from 'react';

import {loadDefaultViewerMenu} from 'app/Viewer/actions/documentActions';
import Document from 'app/Viewer/components/Document';
import ContextMenu from 'app/ContextMenu/components/ContextMenu';

export default class Viewer extends Component {
  componentDidMount() {
    this.context.store.dispatch(loadDefaultViewerMenu());
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

Viewer.contextTypes = {
  store: PropTypes.object
};

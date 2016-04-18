import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import {loadDefaultViewerMenu, resetDocumentViewer} from 'app/Viewer/actions/documentActions';
import SourceDocument from 'app/Viewer/components/SourceDocument';
import TargetDocument from 'app/Viewer/components/TargetDocument';
import CreateReferencePanel from 'app/Viewer/components/CreateReferencePanel';
import ContextMenu from 'app/ContextMenu/components/ContextMenu';

export class Viewer extends Component {

  componentDidMount() {
    this.context.store.dispatch(loadDefaultViewerMenu());
  }

  componentWillUnmount() {
    this.context.store.dispatch(resetDocumentViewer());
  }

  render() {
    let className = 'document-viewer';
    if (this.props.panelIsOpen) {
      className = 'document-viewer with-panel';
    }
    if (this.props.targetDocument) {
      className = 'document-viewer show-target-document';
    }
    return (
      <div>
        <main className={className + ' col-sm-8 col-sm-offset-2'}>
          <SourceDocument />
          <TargetDocument />
        </main>

        <CreateReferencePanel />
        <ContextMenu />
      </div>
    );
  }

}

Viewer.propTypes = {
  panelIsOpen: PropTypes.bool,
  targetDocument: PropTypes.bool
};

Viewer.contextTypes = {
  store: PropTypes.object
};

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    panelIsOpen: !!uiState.panel,
    targetDocument: !!state.documentViewer.targetDocument._id
  };
};

export default connect(mapStateToProps)(Viewer);

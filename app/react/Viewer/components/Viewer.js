import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import ContextMenu from 'app/ContextMenu';

import {loadDefaultViewerMenu, resetDocumentViewer} from '../actions/documentActions';
import SourceDocument from './SourceDocument';
import TargetDocument from './TargetDocument';
import CreateReferencePanel from './CreateReferencePanel';
import ViewReferencesPanel from './ViewReferencesPanel';
import ViewMetadataPanel from './ViewMetadataPanel';

import ViewerDefaultMenu from './ViewerDefaultMenu';
import ViewerTextSelectedMenu from './ViewerTextSelectedMenu';
import ViewerSaveReferenceMenu from './ViewerSaveReferenceMenu';
import ViewerSaveTargetReferenceMenu from './ViewerSaveTargetReferenceMenu';
import MetadataPanelMenu from './MetadataPanelMenu';

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
        <ViewReferencesPanel />
        <ViewMetadataPanel />

        <ContextMenu>
          <ViewerDefaultMenu/>
          <ViewerTextSelectedMenu/>
          <ViewerSaveReferenceMenu/>
          <ViewerSaveTargetReferenceMenu/>
          <MetadataPanelMenu/>
        </ContextMenu>
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

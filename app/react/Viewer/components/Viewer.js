import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import ContextMenu from 'app/ContextMenu';

import {loadDefaultViewerMenu} from '../actions/documentActions';
import SourceDocument from './SourceDocument';
import TargetDocument from './TargetDocument';
import CreateReferencePanel from './CreateReferencePanel';
import ViewMetadataPanel from './ViewMetadataPanel';

import ViewerDefaultMenu from './ViewerDefaultMenu';
import ViewerTextSelectedMenu from './ViewerTextSelectedMenu';
import ConfirmCloseForm from './ConfirmCloseForm';
import ConfirmCloseReferenceForm from './ConfirmCloseReferenceForm';
import Footer from 'app/App/Footer';
import ShowIf from 'app/App/ShowIf';

export class Viewer extends Component {

  componentDidMount() {
    this.context.store.dispatch(loadDefaultViewerMenu());
  }

  render() {
    let className = 'document-viewer';
    if (this.props.panelIsOpen) {
      className += ' with-panel is-active';
    }
    if (this.props.targetDoc) {
      className += ' show-target-document';
    }
    if (this.props.showConnections) {
      className += ' connections';
    }

    return (
      <div className="row">
        <main className={className}>
          <div className="main-wrapper">
            <ShowIf if={!this.props.targetDoc}>
              <SourceDocument />
            </ShowIf>
            <TargetDocument />
            <Footer/>
          </div>
        </main>

        <ConfirmCloseForm />
        <ConfirmCloseReferenceForm />
        <CreateReferencePanel />
        <ViewMetadataPanel />

        <ContextMenu>
          <ViewerDefaultMenu/>
          <ViewerTextSelectedMenu/>
        </ContextMenu>
      </div>
    );
  }

}

Viewer.propTypes = {
  panelIsOpen: PropTypes.bool,
  targetDoc: PropTypes.bool,
  showConnections: PropTypes.bool
};

Viewer.contextTypes = {
  store: PropTypes.object
};

const mapStateToProps = ({documentViewer}) => {
  let uiState = documentViewer.uiState.toJS();
  return {
    panelIsOpen: !!uiState.panel,
    targetDoc: !!documentViewer.targetDoc.get('_id'),
    showConnections: uiState.tab === 'connections'
  };
};

export default connect(mapStateToProps)(Viewer);

import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {bindActionCreators} from 'redux';

import ContextMenu from 'app/ContextMenu';

import {loadDefaultViewerMenu, loadTargetDocument} from '../actions/documentActions';
import {addReference} from '../actions/referencesActions';
import SourceDocument from './SourceDocument';
import TargetDocument from './TargetDocument';
import {CreateConnectionPanel} from 'app/Connections';
import ViewMetadataPanel from './ViewMetadataPanel';

import ViewerDefaultMenu from './ViewerDefaultMenu';
import ViewerTextSelectedMenu from './ViewerTextSelectedMenu';
import ConfirmCloseForm from './ConfirmCloseForm';
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
        <Helmet title={this.props.doc.get('title') ? this.props.doc.get('title') : 'Document'} />
        <div className="content-header content-header-document">
          <span className="item-icon item-icon-center"><i className="fa fa-adn fa-lg"></i></span>
          <h1 className="item-name">Test entity</h1>
          <span className="item-type item-type-0"><span className="item-type__name">Test</span></span>
        </div>
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
        <ViewMetadataPanel />
        <CreateConnectionPanel containerId={this.props.targetDoc ? 'target' : this.props.doc.get('sharedId')}
                               onCreate={this.props.addReference}
                               onRangedConnect={this.props.loadTargetDocument} />

        <ContextMenu align="bottom" overrideShow={true} show={!this.props.panelIsOpen}>
          <ViewerDefaultMenu/>
        </ContextMenu>
        <ContextMenu align="center" overrideShow={true} show={this.props.showTextSelectMenu}>
          <ViewerTextSelectedMenu/>
        </ContextMenu>
      </div>
    );
  }
}

Viewer.propTypes = {
  doc: PropTypes.object,
  panelIsOpen: PropTypes.bool,
  addReference: PropTypes.func,
  targetDoc: PropTypes.bool,
  loadTargetDocument: PropTypes.func,
  showConnections: PropTypes.bool,
  showTextSelectMenu: PropTypes.bool
};

Viewer.contextTypes = {
  store: PropTypes.object
};

const mapStateToProps = ({documentViewer}) => {
  let uiState = documentViewer.uiState.toJS();
  return {
    doc: documentViewer.doc,
    panelIsOpen: !!uiState.panel,
    targetDoc: !!documentViewer.targetDoc.get('_id'),
    showConnections: documentViewer.sidepanel.tab === 'references',
    showTextSelectMenu: Boolean(!documentViewer.targetDoc.get('_id') && uiState.reference && uiState.reference.sourceRange)
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({addReference, loadTargetDocument}, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Viewer);

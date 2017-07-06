import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {bindActionCreators} from 'redux';

import ContextMenu from 'app/ContextMenu';

import {loadDefaultViewerMenu, loadTargetDocument} from '../actions/documentActions';
import {openPanel} from '../actions/uiActions';
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
import {TemplateLabel, Icon} from 'app/Layout';
import Marker from 'app/Viewer/utils/Marker';

export class Viewer extends Component {

  componentWillMount() {
    this.context.store.dispatch(openPanel('viewMetadataPanel'));
  }

  componentDidMount() {
    this.context.store.dispatch(loadDefaultViewerMenu());
    Marker.init('div.main-wrapper');
  }

  render() {
    const {doc} = this.props;

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
        <Helmet title={doc.get('title') ? doc.get('title') : 'Document'} />
        <ShowIf if={!this.props.targetDoc}>
          <div className="content-header content-header-document">
            <div className="content-header-title">
              <Icon className="item-icon item-icon-center" data={doc.get('icon') ? doc.get('icon').toJS() : {}} size="sm"/>
              <h1 className="item-name">{doc.get('title')}</h1>
              <TemplateLabel template={doc.get('template')}/>
            </div>
          </div>
        </ShowIf>
        <main className={className}>
          <div className="main-wrapper">
            <ShowIf if={!this.props.targetDoc}>
              <SourceDocument page={this.props.page} searchTerm={this.props.searchTerm}/>
            </ShowIf>
            <TargetDocument />
            <Footer/>
          </div>
        </main>

        <ConfirmCloseForm />
        <ViewMetadataPanel storeKey={'documentViewer'} searchTerm={this.props.searchTerm}/>
        <CreateConnectionPanel containerId={this.props.targetDoc ? 'target' : doc.get('sharedId')}
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
  page: PropTypes.number,
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

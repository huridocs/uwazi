import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { List } from 'immutable';

import { ConnectionsList } from 'app/ConnectionsList';
import { CreateConnectionPanel } from 'app/Connections';
import { CurrentLocationLink, Icon } from 'app/Layout';
import { RelationshipsFormButtons } from 'app/Relationships';
import { Translate, I18NLink } from 'app/I18N';
import { actions } from 'app/BasicReducer';
import AddEntitiesPanel from 'app/Relationships/components/AddEntities';
import ContextMenu from 'app/ContextMenu';
import Footer from 'app/App/Footer';
import Marker from 'app/Viewer/utils/Marker';
import RelationshipMetadata from 'app/Relationships/components/RelationshipMetadata';
import ShowIf from 'app/App/ShowIf';
import { RequestParams } from 'app/utils/RequestParams';

import { PaginatorWithPage } from './Paginator';
import { addReference } from '../actions/referencesActions';
import { loadDefaultViewerMenu, loadTargetDocument } from '../actions/documentActions';
import { openPanel } from '../actions/uiActions';
import { selectDoc } from '../selectors';
import ConfirmCloseForm from './ConfirmCloseForm';
import SourceDocument from './SourceDocument';
import TargetDocument from './TargetDocument';
import ViewMetadataPanel from './ViewMetadataPanel';
import ViewerDefaultMenu from './ViewerDefaultMenu';
import ViewerTextSelectedMenu from './ViewerTextSelectedMenu';

import determineDirection from '../utils/determineDirection';
import { requestViewerState } from '../actions/routeActions';


export class Viewer extends Component {
  constructor(props) {
    super(props);
    this.state = { firstRender: true };
    this.handlePlainTextClick = this.handlePlainTextClick.bind(this);
  }

  componentWillMount() {
    this.context.store.dispatch(openPanel('viewMetadataPanel'));
    if (this.props.sidepanelTab === 'connections') {
      this.context.store.dispatch(actions.set('viewer.sidepanel.tab', ''));
    }
  }

  handlePlainTextClick() {
    this.props.showTab('metadata');
  }

  componentDidMount() {
    this.context.store.dispatch(loadDefaultViewerMenu());
    Marker.init('div.main-wrapper');
    this.setState({ firstRender: false }); // eslint-disable-line react/no-did-mount-set-state

    // ---------------------------------------------------------------------------------------------------------------------
    // @konzz I have added this which is the component that receives the doc... the documentViewer knows nothing about it.
    // TEST!!!
    const { store } = this.context;
    const { doc } = store.getState().documentViewer;
    const { templates } = this.props;

    if (doc.size && !doc.get('pdfInfo')) {
      console.log('Missing pdfInfo, and server rendered!!!');
      requestViewerState(new RequestParams({ sharedId: doc.get('sharedId') }), { templates: templates.toJS() })
      .then((viewerActions) => {
        viewerActions.forEach((action) => {
          store.dispatch(action);
        });
      });
    }
    // ---------------------------------------------------------------------------------------------------------------------
  }

  renderNoDoc() {
    const { doc } = this.props;
    return (
      <div className="row">
        <div className="content-header content-header-document">
          <div className="content-header-title">
            <Icon icon="lightbulb" />
            <Translate>
              This entity has no document, you probably want to see the metadata
            </Translate>
            &nbsp;
            <I18NLink to={`/entity/${doc.get('sharedId')}`}><Translate>view</Translate></I18NLink>
          </div>
        </div>
      </div>
    );
  }


  render() {
    const { doc, sidepanelTab } = this.props;
    if (doc.get('_id') && !doc.get('file')) {
      return this.renderNoDoc();
    }
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

    const { raw, searchTerm, pageText, page } = this.props;
    const documentTitle = doc.get('title') ? doc.get('title') : '';
    const documentFile = doc.get('file') ? doc.get('file').toJS() : {};

    return (
      <div className="row">
        <Helmet title={`${documentTitle} • Page ${page}`} />
        <ShowIf if={!this.props.targetDoc}>
          <div className="content-header content-header-document">
            <div className="content-header-title">
              {sidepanelTab !== 'connections' && (
                <React.Fragment>
                  <PaginatorWithPage
                    totalPages={doc.get('totalPages')}
                    onPageChange={this.props.changePage}
                  />
                  <CurrentLocationLink
                    onClick={!raw ? this.handlePlainTextClick : () => {}}
                    className="btn btn-default"
                    queryParams={{ raw: raw || this.state.firstRender ? '' : 'true' }}
                  >
                    { raw || this.state.firstRender ? <Translate>Normal view</Translate> : <Translate>Plain text</Translate> }
                  </CurrentLocationLink>
                </React.Fragment>
              )}
            </div>
          </div>
        </ShowIf>
        <main className={className}>
          <div className="main-wrapper">
            <ShowIf if={sidepanelTab !== 'connections' && !this.props.targetDoc}>
              {raw || this.state.firstRender ?
                <pre className={determineDirection(documentFile)}>{pageText}</pre> :
                <SourceDocument searchTerm={searchTerm} onPageChange={this.props.onPageChange} onDocumentReady={this.props.onDocumentReady}/>
              }
            </ShowIf>
            <ShowIf if={sidepanelTab === 'connections'}>
              <ConnectionsList hideFooter searchCentered />
            </ShowIf>
            <TargetDocument />
            <Footer/>
          </div>
        </main>

        <ConfirmCloseForm />
        <ViewMetadataPanel raw={raw || this.state.firstRender} storeKey="documentViewer" searchTerm={searchTerm}/>
        <CreateConnectionPanel
          containerId={this.props.targetDoc ? 'target' : doc.get('sharedId')}
          onCreate={this.props.addReference}
          onRangedConnect={this.props.loadTargetDocument}
        />

        <ShowIf if={sidepanelTab === 'connections'}>
          <RelationshipMetadata />
        </ShowIf>

        <ShowIf if={sidepanelTab === 'connections'}>
          <AddEntitiesPanel />
        </ShowIf>

        <ShowIf if={sidepanelTab === 'connections'}>
          <div className="sidepanel-footer">
            <RelationshipsFormButtons />
          </div>
        </ShowIf>

        <ContextMenu align="bottom" overrideShow show={!this.props.panelIsOpen}>
          <ViewerDefaultMenu/>
        </ContextMenu>
        <ContextMenu align="center" overrideShow show={this.props.showTextSelectMenu}>
          <ViewerTextSelectedMenu/>
        </ContextMenu>
      </div>
    );
  }
}

Viewer.defaultProps = {
  searchTerm: '',
  raw: false,
  onPageChange: () => {},
  changePage: () => {},
  onDocumentReady: () => {},
  page: 1,
  templates: List()
};

Viewer.propTypes = {
  searchTerm: PropTypes.string,
  raw: PropTypes.bool,
  onPageChange: PropTypes.func,
  changePage: PropTypes.func,
  onDocumentReady: PropTypes.func,
  doc: PropTypes.object,
  pageText: PropTypes.string,
  panelIsOpen: PropTypes.bool,
  addReference: PropTypes.func,
  targetDoc: PropTypes.bool,
  // TEST!!!!!
  sidepanelTab: PropTypes.string,
  loadTargetDocument: PropTypes.func,
  showConnections: PropTypes.bool,
  showTextSelectMenu: PropTypes.bool,
  selectedConnection: PropTypes.bool,
  selectedConnectionMetadata: PropTypes.object,
  showTab: PropTypes.func,
  page: PropTypes.number,
  templates: PropTypes.instanceOf(List),
};

Viewer.contextTypes = {
  store: PropTypes.object
};


const mapStateToProps = (state) => {
  const { documentViewer } = state;
  const uiState = documentViewer.uiState.toJS();
  return {
    pageText: documentViewer.rawText,
    doc: selectDoc(state),
    panelIsOpen: !!uiState.panel,
    targetDoc: !!documentViewer.targetDoc.get('_id'),
    // TEST!!!
    sidepanelTab: documentViewer.sidepanel.tab,
    showConnections: documentViewer.sidepanel.tab === 'references',
    showTextSelectMenu: Boolean(!documentViewer.targetDoc.get('_id') && uiState.reference && uiState.reference.sourceRange),
    // TEST!!!
    templates: state.templates,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  addReference,
  loadTargetDocument,
  showTab: tab => actions.set('viewer.sidepanel.tab', tab),
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Viewer);

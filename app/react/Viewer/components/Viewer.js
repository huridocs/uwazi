import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { List, Map } from 'immutable';

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
import { addReference as addReferenceAction } from '../actions/referencesActions';
import {
  loadDefaultViewerMenu,
  loadTargetDocument as loadTargetDocumentAction,
} from '../actions/documentActions';
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
    const { store } = this.context;
    const { sidepanelTab } = this.props;

    store.dispatch(openPanel('viewMetadataPanel'));
    if (sidepanelTab === 'connections') {
      store.dispatch(actions.set('viewer.sidepanel.tab', ''));
    }
  }

  componentDidMount() {
    const { store } = this.context;

    store.dispatch(loadDefaultViewerMenu());
    Marker.init('div.main-wrapper');
    this.setState({ firstRender: false }); // eslint-disable-line react/no-did-mount-set-state

    const { templates, doc } = this.props;

    if (doc.size && !doc.get('pdfInfo')) {
      requestViewerState(new RequestParams({ sharedId: doc.get('sharedId') }), {
        templates: templates.toJS(),
      }).then(viewerActions => {
        viewerActions.forEach(action => {
          store.dispatch(action);
        });
      });
    }
  }

  handlePlainTextClick() {
    const { showTab } = this.props;
    showTab('metadata');
  }

  prepareClassName() {
    const { panelIsOpen, targetDoc, showConnections } = this.props;

    let className = 'document-viewer';

    if (panelIsOpen) {
      className += ' with-panel is-active';
    }
    if (targetDoc) {
      className += ' show-target-document';
    }
    if (showConnections) {
      className += ' connections';
    }

    return className;
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
            <I18NLink to={`/entity/${doc.get('sharedId')}`}>
              <Translate>view</Translate>
            </I18NLink>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      doc,
      sidepanelTab,
      targetDoc,
      changePage,
      onPageChange,
      onDocumentReady,
      addReference,
      loadTargetDocument,
      panelIsOpen,
      showTextSelectMenu,
    } = this.props;
    const { firstRender } = this.state;
    if (doc.get('_id') && !doc.get('file')) {
      return this.renderNoDoc();
    }

    const className = this.prepareClassName();

    const { raw, searchTerm, pageText, page } = this.props;
    const documentTitle = doc.get('title') ? doc.get('title') : '';
    const documentFile = doc.get('file') ? doc.get('file').toJS() : {};

    return (
      <div className="row">
        <Helmet title={`${documentTitle} • Page ${page}`} />
        <ShowIf if={!targetDoc}>
          <div className="content-header content-header-document">
            <div className="content-header-title">
              {sidepanelTab !== 'connections' && (
                <React.Fragment>
                  <PaginatorWithPage totalPages={doc.get('totalPages')} onPageChange={changePage} />
                  <CurrentLocationLink
                    onClick={!raw ? this.handlePlainTextClick : () => {}}
                    className="btn btn-default"
                    queryParams={{ raw: raw || firstRender ? '' : 'true' }}
                  >
                    {raw || firstRender ? (
                      <Translate>Normal view</Translate>
                    ) : (
                      <Translate>Plain text</Translate>
                    )}
                  </CurrentLocationLink>
                </React.Fragment>
              )}
            </div>
          </div>
        </ShowIf>
        <main className={className}>
          <div className="main-wrapper">
            <ShowIf if={sidepanelTab !== 'connections' && !targetDoc}>
              {raw || firstRender ? (
                <pre className={determineDirection(documentFile)}>{pageText}</pre>
              ) : (
                <SourceDocument
                  searchTerm={searchTerm}
                  onPageChange={onPageChange}
                  onDocumentReady={onDocumentReady}
                />
              )}
            </ShowIf>
            <ShowIf if={sidepanelTab === 'connections'}>
              <ConnectionsList hideFooter searchCentered />
            </ShowIf>
            <TargetDocument />
            <Footer />
          </div>
        </main>

        <ConfirmCloseForm />
        <ViewMetadataPanel
          raw={raw || firstRender}
          storeKey="documentViewer"
          searchTerm={searchTerm}
        />
        <CreateConnectionPanel
          containerId={targetDoc ? 'target' : doc.get('sharedId')}
          onCreate={addReference}
          onRangedConnect={loadTargetDocument}
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

        <ContextMenu align="bottom" overrideShow show={!panelIsOpen}>
          <ViewerDefaultMenu />
        </ContextMenu>
        <ContextMenu align="center" overrideShow show={showTextSelectMenu}>
          <ViewerTextSelectedMenu />
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
  templates: List(),
  doc: Map(),
};

Viewer.propTypes = {
  searchTerm: PropTypes.string,
  raw: PropTypes.bool,
  onPageChange: PropTypes.func,
  changePage: PropTypes.func,
  onDocumentReady: PropTypes.func,
  doc: PropTypes.instanceOf(Map),
  pageText: PropTypes.string,
  panelIsOpen: PropTypes.bool,
  addReference: PropTypes.func,
  targetDoc: PropTypes.bool,
  // TEST!!!!!!
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
  store: PropTypes.object,
};

const mapStateToProps = state => {
  const { documentViewer } = state;
  const uiState = documentViewer.uiState.toJS();
  return {
    pageText: documentViewer.rawText,
    doc: selectDoc(state),
    panelIsOpen: !!uiState.panel,
    targetDoc: !!documentViewer.targetDoc.get('_id'),
    templates: state.templates,
    // TEST!!!!
    sidepanelTab: documentViewer.sidepanel.tab,
    showConnections: documentViewer.sidepanel.tab === 'references',
    showTextSelectMenu: Boolean(
      !documentViewer.targetDoc.get('_id') && uiState.reference && uiState.reference.sourceRange
    ),
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      addReference: addReferenceAction,
      loadTargetDocument: loadTargetDocumentAction,
      showTab: tab => actions.set('viewer.sidepanel.tab', tab),
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Viewer);

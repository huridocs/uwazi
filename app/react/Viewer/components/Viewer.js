import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Map } from 'immutable';
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
import { NeedAuthorization } from 'app/Auth';
import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
import V2NewRelationshipsBoard from 'app/Entities/components/V2NewRelationshipsBoard';
import { PaginatorWithPage } from './Paginator';
import { addReference as addReferenceAction } from '../actions/referencesActions';
import {
  loadDefaultViewerMenu,
  loadTargetDocument as loadTargetDocumentAction,
} from '../actions/documentActions';
import { openPanel } from '../actions/uiActions';
import { selectDoc } from '../selectors';
import ConfirmCloseForm from './ConfirmCloseForm';
import ViewMetadataPanel from './ViewMetadataPanel';
import ViewerDefaultMenu from './ViewerDefaultMenu';
import ViewerTextSelectedMenu from './ViewerTextSelectedMenu';
import SourceDocument from './SourceDocument';
import TargetDocument from './TargetDocument.js';
import determineDirection from '../utils/determineDirection';
import { OCRStatus } from './OCRStatus';

class Viewer extends Component {
  constructor(props) {
    super(props);
    this.state = { firstRender: true };
    this.handlePlainTextClick = this.handlePlainTextClick.bind(this);
  }

  componentDidMount() {
    const { store } = this.context;
    const { sidepanelTab } = this.props;
    store.dispatch(openPanel('viewMetadataPanel'));
    if (sidepanelTab === 'connections') {
      store.dispatch(actions.set('viewer.sidepanel.tab', ''));
    }
    store.dispatch(loadDefaultViewerMenu());
    Marker.init('div.main-wrapper');
    this.setState({ firstRender: false }); // eslint-disable-line react/no-did-mount-set-state
  }

  handlePlainTextClick() {
    const { showTab } = this.props;
    showTab('metadata');
  }

  prepareClassName(includeFooter) {
    const { panelIsOpen, targetDoc, showConnections } = this.props;
    let className = 'document-viewer with-header';
    className += panelIsOpen ? ' with-panel is-active' : '';
    className += targetDoc ? ' show-target-document' : '';
    className += showConnections ? ' connections' : '';
    className += includeFooter ? ' with-footer' : '';
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
      file,
      user,
    } = this.props;
    const { firstRender } = this.state;
    if (doc.get('_id') && !doc.get('documents').size) {
      return this.renderNoDoc();
    }
    const includeFooter = user.get('_id') && sidepanelTab === 'relationships';
    const className = this.prepareClassName(includeFooter);
    const { raw, searchTerm, pageText, page } = this.props;
    const documentTitle = doc.get('title') ? doc.get('title') : '';

    return (
      <div className="row">
        <Helmet>
          <title>{`${documentTitle} • Page ${page}`}</title>
        </Helmet>
        <ShowIf if={!targetDoc}>
          <div className="content-header content-header-document">
            <div className="content-header-title">
              {sidepanelTab !== 'relationships' && (
                <>
                  <PaginatorWithPage totalPages={file.totalPages} onPageChange={changePage} />
                  <NeedAuthorization roles={['admin', 'editor']}>
                    <FeatureToggle feature="ocr.url">
                      <OCRStatus file={file} />
                    </FeatureToggle>
                  </NeedAuthorization>
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
                </>
              )}
            </div>
          </div>
        </ShowIf>
        <main className={className}>
          <div className="main-wrapper">
            <ShowIf
              if={
                !['connections', 'relationships', 'newrelationships'].includes(sidepanelTab) &&
                !targetDoc
              }
            >
              {raw || firstRender ? (
                <div className={`${determineDirection(file)} raw-text`}>{pageText}</div>
              ) : (
                <SourceDocument
                  searchTerm={searchTerm}
                  onPageChange={onPageChange}
                  onDocumentReady={onDocumentReady}
                  file={file}
                />
              )}
            </ShowIf>
            <ShowIf if={sidepanelTab === 'connections' || sidepanelTab === 'relationships'}>
              <ConnectionsList hideFooter searchCentered />
            </ShowIf>
            <ShowIf if={this.props.newRelationshipsEnabled && sidepanelTab === 'newrelationships'}>
              <V2NewRelationshipsBoard sharedId={doc.get('sharedId')} />
            </ShowIf>
            <TargetDocument />
            <Footer />
          </div>
          {includeFooter && (
            <div className={`entity-footer remove-nesting ${panelIsOpen ? 'with-sidepanel' : ''}`}>
              <RelationshipsFormButtons />
            </div>
          )}
        </main>
        <ConfirmCloseForm />
        <ViewMetadataPanel
          raw={raw || firstRender}
          storeKey="documentViewer"
          searchTerm={searchTerm}
          file={file}
        />
        <CreateConnectionPanel
          containerId={targetDoc ? 'target' : doc.get('sharedId')}
          onCreate={addReference}
          onRangedConnect={loadTargetDocument}
          file={file}
        />
        {sidepanelTab === 'relationships' && (
          <>
            <RelationshipMetadata />
            <AddEntitiesPanel />
          </>
        )}
        <ContextMenu
          align={`bottom${includeFooter ? '-with-footer' : ''}`}
          overrideShow
          show={!panelIsOpen}
        >
          <ViewerDefaultMenu />
        </ContextMenu>
        <ContextMenu align="center" overrideShow show={showTextSelectMenu}>
          <ViewerTextSelectedMenu file={file} />
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
  doc: Map(),
  file: {},
  user: Map({}),
  // relationships v2
  newRelationshipsEnabled: false,
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
  sidepanelTab: PropTypes.string,
  loadTargetDocument: PropTypes.func,
  showConnections: PropTypes.bool,
  showTextSelectMenu: PropTypes.bool,
  selectedConnection: PropTypes.bool,
  selectedConnectionMetadata: PropTypes.object,
  showTab: PropTypes.func,
  page: PropTypes.number,
  locale: PropTypes.string.isRequired,
  file: PropTypes.object,
  user: PropTypes.instanceOf(Map),
  // relationships v2
  newRelationshipsEnabled: PropTypes.bool,
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
    locale: state.locale,
    sidepanelTab: documentViewer.sidepanel.tab,
    showConnections: documentViewer.sidepanel.tab === 'references',
    showTextSelectMenu: Boolean(
      !documentViewer.targetDoc.get('_id') && uiState.reference && uiState.reference.sourceRange
    ),
    user: state.user,
    // relationships v2
    newRelationshipsEnabled: state.settings?.collection?.get('features')?.get('newRelationships'),
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

const ConnectedViewer = connect(mapStateToProps, mapDispatchToProps)(Viewer);
export { ConnectedViewer };

/* eslint-disable max-lines */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { toUrlParams } from 'shared/JSONRequest';
import rison from 'rison-node';
import { SearchBar } from 'app/Library/components/SearchBar';
import { Loader } from 'app/components/Elements/Loader';
import Footer from 'app/App/Footer';

import { NeedAuthorization } from 'app/Auth';
import { t, Translate } from 'app/I18N';
import { DocumentCounter } from 'app/Layout/DocumentCounter';
import { Icon } from 'UI';
import { withRouter } from 'app/componentWrappers';
import { LibraryHeader } from 'app/Library/components/LibraryHeader';
import Welcome from './components/Welcome';
import { TilesViewer } from './TilesViewer';
import blankState from '../Library/helpers/blankState';

const selectAllEntities = command => {
  command.selectAllDocuments();
};
class DocumentsList extends Component {
  static getDerivedStateFromProps(newProps, prevState) {
    const { scrollCount = 0, parentScrollCount = 0 } = prevState;
    if (newProps.scrollCount !== parentScrollCount) {
      return {
        loading: false,
        scrollCount: scrollCount + 1,
        parentScrollCount: newProps.scrollCount,
      };
    }

    return { loading: false };
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      loading: false,
      scrollCount: 0,
      parentScrollCount: 0,
    };
    this.clickOnDocument = this.clickOnDocument.bind(this);
    this.selectAllDocuments = this.selectAllDocuments.bind(this);
    this.loadNextGroupOfEntities = this.loadNextGroupOfEntities.bind(this);
  }

  loadMoreDocuments(amount, from) {
    this.setState({ loading: true });
    this.props.loadMoreDocuments(amount, from, this.props.location, this.props.navigate);
  }

  selectAllDocuments() {
    if (this.props.selectAllDocuments) {
      this.props.selectAllDocuments.apply(this);
    }
  }

  clickOnDocument(...args) {
    if (this.props.clickOnDocument) {
      this.props.clickOnDocument.apply(this, args);
    }
  }

  loadNextGroupOfEntities() {
    const from = this.props.documents.get('rows').size;
    const DEFAULT_PAGE_SIZE = 30;
    if (from) {
      this.loadMoreDocuments(DEFAULT_PAGE_SIZE, from);
    }
  }

  loadMoreButton(amount) {
    const query = { ...this.props.location.query };
    const q = query.q ? rison.decode(query.q) : {};
    const from = this.props.documents.get('rows').size;
    q.from = from;
    q.limit = amount;
    query.q = rison.encode(q);
    const url = `${this.props.location.pathname}${toUrlParams(query)}`;
    return (
      <Link
        to={url}
        className="btn btn-default btn-load-more"
        onClick={e => {
          e.preventDefault();
          this.loadMoreDocuments(amount, from);
        }}
      >
        {amount} {t('System', 'x more')}
      </Link>
    );
  }

  relationshipsToolbar(counter) {
    const SortButtonsRelationships = this.props.SortButtons;
    const SearchBarRelationships = this.props.SearchBar;

    return (
      <div className="relationship-toolbar">
        <div className="search-list">
          <SearchBarRelationships />
        </div>
        <div className="sort-by">
          <span className="documents-counter-sort">
            <Translate>sorted by</Translate>
          </span>
          <SortButtonsRelationships
            sortCallback={this.props.searchDocuments}
            selectedTemplates={this.props.filters.get('documentTypes')}
            stateProperty={this.props.sortButtonsStateProperty}
          />
        </div>
        <div className="documents-counter">
          <span className="documents-counter-label">{counter}</span>
        </div>
      </div>
    );
  }

  render() {
    const {
      documents,
      connections,
      GraphView,
      view,
      hideFooter,
      connectionsGroups,
      LoadMoreButton,
      rowListZoomLevel,
      CollectionViewer,
    } = this.props;

    const totalConnections = connections
      ? connectionsGroups.reduce(
          (total, g) =>
            total +
            g.get('templates').reduce((count, template) => count + template.get('count'), 0),
          0
        )
      : undefined;

    const counter = (
      <DocumentCounter
        selectedEntitiesCount={this.props.selectedDocuments.size}
        entityListCount={this.props.documents.get('rows').size}
        entityTotal={documents.get('totalRows')}
        hitsTotalRelation={documents.get('relation')}
        totalConnectionsCount={totalConnections}
      />
    );

    const FooterComponent = !hideFooter ? <Footer /> : null;

    const libraryContent = () => {
      if (view !== 'graph') {
        return (
          <CollectionViewer
            {...{
              rowListZoomLevel,
              storeKey: this.props.storeKey,
              clickOnDocument: this.clickOnDocument,
              onSnippetClick: this.props.onSnippetClick,
              deleteConnection: this.props.deleteConnection,
              loadNextGroupOfEntities: this.loadNextGroupOfEntities,
            }}
          />
        );
      }
      if (view === 'graph') {
        return <GraphView clickOnDocument={this.clickOnDocument} />;
      }
      return null;
    };
    const loadMoreSection = (
      <div className="row">
        {(() => {
          if (view !== 'graph') {
            return <p className="col-sm-12 text-center documents-counter">{counter}</p>;
          }
          return null;
        })()}
        {(() => {
          if (LoadMoreButton) {
            return <LoadMoreButton />;
          }
          if (documents.get('rows').size < documents.get('totalRows') && !this.state.loading) {
            return (
              <div className="col-sm-12 text-center">
                {this.loadMoreButton(30)} {this.loadMoreButton(300)}
              </div>
            );
          }
          if (this.state.loading) {
            return <Loader />;
          }
          return null;
        })()}
        <NeedAuthorization>
          <div className="col-sm-12 force-ltr text-center protip">
            <Icon icon="lightbulb" />{' '}
            <b>
              <Translate>ProTip!</Translate>
            </b>
            <span>
              <Translate>Use</Translate>&nbsp;
              <span className="protip-key" no-translate="true">
                cmd
              </span>
              &nbsp; <Translate>or</Translate>{' '}
              <span className="protip-key" no-translate="true">
                shift
              </span>
              &nbsp; <Translate>+ click to select multiple cards.</Translate>
            </span>
          </div>
        </NeedAuthorization>
      </div>
    );

    return (
      <div className="documents-list">
        <div className="main-wrapper">
          {this.props.SortButtons === undefined && (
            <LibraryHeader
              storeKey={this.props.storeKey}
              counter={counter}
              selectAllDocuments={() => {
                selectAllEntities(this);
              }}
              SearchBar={this.props.SearchBar}
              searchCentered={this.props.searchCentered}
              filters={this.props.filters}
              tableViewMode={this.props.tableViewMode}
              scrollCount={this.state.scrollCount}
            />
          )}
          {this.props.SortButtons !== undefined && this.relationshipsToolbar(counter)}

          {blankState() && <Welcome />}

          {CollectionViewer.wrapLoader && (
            <div
              className="library-load-container"
              onScroll={() => {
                this.setState((prevState, _props) => ({
                  scrollCount: prevState.scrollCount + 1,
                }));
              }}
            >
              {libraryContent()}
              {loadMoreSection}
            </div>
          )}
          {!CollectionViewer.wrapLoader && (
            <>
              {libraryContent()}
              {loadMoreSection}
            </>
          )}

          {FooterComponent}
        </div>
      </div>
    );
  }
}

DocumentsList.defaultProps = {
  SearchBar,
  rowListZoomLevel: 0,
  CollectionViewer: TilesViewer,
  selectedDocuments: {},
  tableViewMode: false,
  scrollCount: 0,
  SortButtons: undefined,
};

DocumentsList.propTypes = {
  documents: PropTypes.object.isRequired,
  connections: PropTypes.object,
  filters: PropTypes.object,
  thesauri: PropTypes.object,
  selectedDocuments: PropTypes.instanceOf(Object),
  SearchBar: PropTypes.func,
  SortButtons: PropTypes.func,
  GraphView: PropTypes.func,
  search: PropTypes.object,
  loadMoreDocuments: PropTypes.func,
  searchDocuments: PropTypes.func,
  deleteConnection: PropTypes.func,
  sortButtonsStateProperty: PropTypes.string,
  storeKey: PropTypes.string,
  LoadMoreButton: PropTypes.func,
  onSnippetClick: PropTypes.func,
  clickOnDocument: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  selectAllDocuments: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  rowListZoomLevel: PropTypes.number,
  connectionsGroups: PropTypes.object,
  searchCentered: PropTypes.bool,
  hideFooter: PropTypes.bool,
  view: PropTypes.string,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    query: PropTypes.shape({ page: PropTypes.string, raw: PropTypes.string }),
  }).isRequired,
  navigate: PropTypes.func.isRequired,
  CollectionViewer: PropTypes.func,
  tableViewMode: PropTypes.bool,
  scrollCount: PropTypes.number,
};

export { DocumentsList };

export default withRouter(DocumentsList);

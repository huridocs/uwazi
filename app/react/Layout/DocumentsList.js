/* eslint-disable max-lines */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router';
import { toUrlParams } from 'shared/JSONRequest';
import rison from 'rison-node';
import SearchBar from 'app/Library/components/SearchBar';
import SortButtons from 'app/Library/components/SortButtons';
import Loader from 'app/components/Elements/Loader';
import Footer from 'app/App/Footer';
import { NeedAuthorization } from 'app/Auth';
import { t, Translate } from 'app/I18N';
import { DocumentCounter } from 'app/Layout/DocumentCounter';
import { Icon } from 'UI';
import Welcome from './components/Welcome';
import { TilesViewer } from './TilesViewer';
import blankState from '../Library/helpers/blankState';

class DocumentsList extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { loading: false };
    this.clickOnDocument = this.clickOnDocument.bind(this);
    this.selectAllDocuments = this.selectAllDocuments.bind(this);
    this.loadNextGroupOfEntities = this.loadNextGroupOfEntities.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({ loading: false });
  }

  loadMoreDocuments(amount, from) {
    this.setState({ loading: true });
    this.props.loadMoreDocuments(this.props.storeKey, amount, from);
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

  render() {
    const {
      documents,
      connections,
      GraphView,
      view,
      searchCentered,
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

    const Search = this.props.SearchBar;
    const ActionButtons = this.props.ActionButtons ? (
      <div className="search-list-actions">
        <this.props.ActionButtons />
      </div>
    ) : null;
    const FooterComponent = !hideFooter ? <Footer /> : null;

    return (
      <div className="documents-list">
        <div className="main-wrapper">
          <div className={`search-list ${searchCentered ? 'centered' : ''}`}>
            {ActionButtons} {Search && <Search storeKey={this.props.storeKey} />}
          </div>
          <div className={`sort-by ${searchCentered ? 'centered' : ''}`}>
            <span className="documents-counter-sort">
              <Translate>sorted by</Translate>
            </span>
            <SortButtons
              sortCallback={this.props.searchDocuments}
              selectedTemplates={this.props.filters.get('documentTypes')}
              stateProperty={this.props.sortButtonsStateProperty}
              storeKey={this.props.storeKey}
            />
            <NeedAuthorization>
              <div className="select-all-documents">
                <button
                  type="button"
                  className="btn btn-default btn-xs"
                  onClick={this.selectAllDocuments}
                >
                  <Translate>Select all</Translate>
                </button>
              </div>
            </NeedAuthorization>
            <div className="documents-counter">
              <span className="documents-counter-label">{counter}</span>
            </div>
          </div>
          {blankState() && <Welcome />}

          {(() => {
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
          })()}

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
                  <span className="protip-key" no-translate>
                    cmd
                  </span>
                  &nbsp; <Translate>or</Translate>{' '}
                  <span className="protip-key" no-translate>
                    shift
                  </span>
                  &nbsp; <Translate>+ click to select multiple cards.</Translate>
                </span>
              </div>
            </NeedAuthorization>
          </div>
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
};

DocumentsList.propTypes = {
  documents: PropTypes.object.isRequired,
  connections: PropTypes.object,
  filters: PropTypes.object,
  thesauri: PropTypes.object,
  selectedDocuments: PropTypes.instanceOf(Object),
  SearchBar: PropTypes.func,
  ActionButtons: PropTypes.func,
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
    query: PropTypes.object,
  }),
  CollectionViewer: PropTypes.func,
};

export { DocumentsList };
export default withRouter(DocumentsList);

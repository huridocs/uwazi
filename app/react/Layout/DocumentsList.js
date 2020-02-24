import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router';
import { toUrlParams } from 'shared/JSONRequest';
import rison from 'rison';

import Doc from 'app/Library/components/Doc';
import SearchBar from 'app/Library/components/SearchBar';
import SortButtons from 'app/Library/components/SortButtons';

import { RowList } from 'app/Layout/Lists';
import Loader from 'app/components/Elements/Loader';
import Footer from 'app/App/Footer';
import { NeedAuthorization } from 'app/Auth';
import { t, Translate } from 'app/I18N';
import { Icon } from 'UI';

class DocumentsList extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { loading: false };
    this.clickOnDocument = this.clickOnDocument.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({ loading: false });
  }

  clickOnDocument() {
    if (this.props.clickOnDocument) {
      this.props.clickOnDocument.apply(this, arguments);
    }
  }

  loadMoreDocuments(amount) {
    this.setState({ loading: true });
    this.setState({ loading: true });
    this.props.loadMoreDocuments(
      this.props.storeKey,
      this.props.documents.get('rows').size + amount
    );
  }

  loadMoreButton(amount) {
    const query = Object.assign({}, this.props.location.query);
    const q = query.q ? rison.decode(query.q) : {};
    q.limit = (parseInt(q.limit, 10) || 30) + amount;
    query.q = rison.encode(q);
    const url = `${this.props.location.pathname}${toUrlParams(query)}`;
    return (
      <Link
        to={url}
        className="btn btn-default btn-load-more"
        onClick={this.loadMoreDocuments.bind(this, amount)}
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
    } = this.props;
    let counter = (
      <span>
        <b>{documents.get('totalRows')}</b> <Translate>documents</Translate>
      </span>
    );
    if (connections) {
      const summary = connectionsGroups.reduce(
        (summaryData, g) => {
          g.get('templates').forEach(template => {
            summaryData.totalConnections += template.get('count');
          });
          return summaryData;
        },
        { totalConnections: 0 }
      );
      counter = (
        <span>
          <b>{summary.totalConnections}</b> {t('System', 'connections')},{' '}
          <b>{documents.get('totalRows')}</b> {t('System', 'documents')}
        </span>
      );
    }

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
            {ActionButtons}
            {Search && <Search storeKey={this.props.storeKey} />}
          </div>
          <div className={`sort-by ${searchCentered ? 'centered' : ''}`}>
            <div className="documents-counter">
              <span className="documents-counter-label">{counter}</span>
              <span className="documents-counter-sort">{t('System', 'sorted by')}:</span>
            </div>
            <SortButtons
              sortCallback={this.props.searchDocuments}
              selectedTemplates={this.props.filters.get('documentTypes')}
              stateProperty={this.props.sortButtonsStateProperty}
              storeKey={this.props.storeKey}
            />
          </div>
          {(() => {
            if (view !== 'graph') {
              return (
                <RowList zoomLevel={rowListZoomLevel}>
                  {documents.get('rows').map((doc, index) => (
                    <Doc
                      doc={doc}
                      storeKey={this.props.storeKey}
                      key={index}
                      onClick={this.clickOnDocument}
                      onSnippetClick={this.props.onSnippetClick}
                      deleteConnection={this.props.deleteConnection}
                      searchParams={this.props.search}
                    />
                  ))}
                </RowList>
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
                return (
                  <p className="col-sm-12 text-center documents-counter">
                    <b> {documents.get('rows').size} </b>
                    {t('System', 'of')}
                    <b> {documents.get('totalRows')} </b>
                    {t('System', 'documents')}
                  </p>
                );
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
                    {this.loadMoreButton(30)}
                    {this.loadMoreButton(300)}
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
                <Icon icon="lightbulb" /> <b>ProTip!</b>
                <span>
                  Use <span className="protip-key">cmd</span> or{' '}
                  <span className="protip-key">shift</span>&nbsp; + click to select multiple files.
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
};

DocumentsList.propTypes = {
  documents: PropTypes.object.isRequired,
  connections: PropTypes.object,
  filters: PropTypes.object,
  selectedDocument: PropTypes.object,
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
  rowListZoomLevel: PropTypes.number,
  connectionsGroups: PropTypes.object,
  searchCentered: PropTypes.bool,
  hideFooter: PropTypes.bool,
  view: PropTypes.string,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    query: PropTypes.object,
  }),
};

export { DocumentsList };

export default withRouter(DocumentsList);

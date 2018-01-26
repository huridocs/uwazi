import PropTypes from 'prop-types';
import React, {Component} from 'react';

import Doc from 'app/Library/components/Doc';
import SearchBar from 'app/Library/components/SearchBar';
import SortButtons from 'app/Library/components/SortButtons';

import {RowList} from 'app/Layout/Lists';
import Loader from 'app/components/Elements/Loader';
import Footer from 'app/App/Footer';
import {NeedAuthorization} from 'app/Auth';
import {t} from 'app/I18N';

const loadMoreAmmount = 30;

export default class DocumentsList extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {loading: false};
    this.clickOnDocument = this.clickOnDocument.bind(this);
    this.loadMoreDocuments = this.loadMoreDocuments.bind(this);
  }

  loadMoreDocuments() {
    this.setState({loading: true});
    this.props.loadMoreDocuments(this.props.storeKey, this.props.documents.get('rows').size + loadMoreAmmount);
  }

  componentWillReceiveProps() {
    this.setState({loading: false});
  }

  clickOnDocument() {
    if (this.props.clickOnDocument) {
      this.props.clickOnDocument.apply(this, arguments);
    }
  }

  render() {
    const {documents, connections, GraphView, view} = this.props;
    let counter = <span><b>{documents.get('totalRows')}</b> {t('System', 'documents')}</span>;
    if (connections) {
      counter = <span>
                  <b>{connections.totalRows}</b> {t('System', 'connections')}, <b>{documents.get('totalRows')}</b> {t('System', 'documents')}
                </span>;
    }

    const Search = this.props.SearchBar;
    const ActionButtons = this.props.ActionButtons ? <div className="search-list-actions"><this.props.ActionButtons /></div> : null;

    return (
      <div className="documents-list">
        <div className="main-wrapper">
          <div className="search-list">
            {ActionButtons}
            <Search storeKey={this.props.storeKey}/>
          </div>
          <div className="sort-by">
              <div className="documents-counter">
                <span className="documents-counter-label">{counter}</span>
                <span className="documents-counter-sort">{t('System', 'sorted by')}:</span>
              </div>
              <SortButtons sortCallback={this.props.searchDocuments}
                           selectedTemplates={this.props.filters.get('documentTypes')}
                           stateProperty={this.props.sortButtonsStateProperty}
                           storeKey={this.props.storeKey}
              />
          </div>
          {(() => {
            if (view !== 'graph') {
              return <RowList>
                      {documents.get('rows').map((doc, index) =>
                        <Doc doc={doc}
                             storeKey={this.props.storeKey}
                             key={index}
                             onClick={this.clickOnDocument}
                             onSnippetClick={this.props.onSnippetClick}
                             deleteConnection={this.props.deleteConnection}
                             searchParams={this.props.search} />
                      )}
                     </RowList>;
            }

            if (view === 'graph') {
              return <GraphView clickOnDocument={this.clickOnDocument}/>;
            }
          })()}
          <div className="row">
            {(() => {
              if (view !== 'graph') {
                return <p className="col-sm-12 text-center documents-counter">
                        <b>{documents.get('rows').size}</b>
                        {` ${t('System', 'of')} `}
                        <b>{documents.get('totalRows')}</b>
                        {` ${t('System', 'documents')}`}
                       </p>;
              }
            })()}
            {(() => {
              if (documents.get('rows').size < documents.get('totalRows') && !this.state.loading) {
                return (
                  <div className="col-sm-12 text-center">
                    <button onClick={this.loadMoreDocuments} className="btn btn-default btn-load-more">
                      {loadMoreAmmount + ' ' + t('System', 'x more')}
                    </button>
                  </div>
                );
              }
              if (this.state.loading) {
                return <Loader/>;
              }

              return null;
            })()}
            <NeedAuthorization>
              <div className="col-sm-12 text-center protip">
                <i className="fa fa-lightbulb-o"></i>
                <b>ProTip!</b>
                <span>Use <span className="protip-key">cmd</span> or <span className="protip-key">shift</span>&nbsp;
                + click to select multiple files.</span>
              </div>
            </NeedAuthorization>
          </div>
          <Footer/>
        </div>
      </div>
    );
  }
}

DocumentsList.defaultProps = {
  SearchBar
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
  onSnippetClick: PropTypes.func,
  clickOnDocument: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.object
  ]),
  view: PropTypes.string
};

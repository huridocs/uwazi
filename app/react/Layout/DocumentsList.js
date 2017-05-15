import PropTypes from 'prop-types';
import React, {Component} from 'react';

import Doc from 'app/Library/components/Doc';
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
    const {documents, connections} = this.props;
    let counter = <span><b>{documents.get('totalRows')}</b> {t('System', 'documents')}</span>;
    if (connections) {
      counter = <span>
                  <b>{connections.totalRows}</b> {t('System', 'connections')}, <b>{documents.get('totalRows')}</b> {t('System', 'documents')}
                </span>;
    }

    return (
      <div className="documents-list">
        <div className="main-wrapper">
          <div className="sort-by">
              <div className="u-floatLeft documents-counter">{counter}</div>
              <SortButtons sortCallback={this.props.searchDocuments}
                           selectedTemplates={this.props.filters.get('documentTypes')}
                           stateProperty={this.props.sortButtonsStateProperty}
                           storeKey={this.props.storeKey}
              />
          </div>
          <RowList>
            {documents.get('rows').map((doc, index) =>
              <Doc doc={doc}
                   storeKey={this.props.storeKey}
                   key={index}
                   onClick={this.clickOnDocument.bind(this)}
                   deleteConnection={this.props.deleteConnection}
                   searchParams={this.props.search} />
            )}
          </RowList>
          <div className="row">
            <p className="col-sm-12 text-center documents-counter">
                <b>{documents.get('rows').size}</b>
                {` ${t('System', 'of')} `}
                <b>{documents.get('totalRows')}</b>
                {` ${t('System', 'documents')}`}
            </p>
            {(() => {
              if (documents.get('rows').size < documents.get('totalRows') && !this.state.loading) {
                return <div className="col-sm-12 text-center">
                <button onClick={this.loadMoreDocuments.bind(this)} className="btn btn-default btn-load-more">
                  {loadMoreAmmount + ' ' + t('System', 'x more')}
                </button>
                </div>;
              }
              if (this.state.loading) {
                return <Loader/>;
              }
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

DocumentsList.propTypes = {
  documents: PropTypes.object.isRequired,
  connections: PropTypes.object,
  filters: PropTypes.object,
  selectedDocument: PropTypes.object,
  search: PropTypes.object,
  loadMoreDocuments: PropTypes.func,
  searchDocuments: PropTypes.func,
  deleteConnection: PropTypes.func,
  sortButtonsStateProperty: PropTypes.string,
  storeKey: PropTypes.string,
  clickOnDocument: PropTypes.func
};

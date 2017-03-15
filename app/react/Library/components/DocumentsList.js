import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {fromJS as Immutable} from 'immutable';
import {createSelector} from 'reselect';

import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';
import {RowList} from 'app/Layout/Lists';
import {loadMoreDocuments, selectDocument, unselectDocument, unselectAllDocuments, selectDocuments} from 'app/Library/actions/libraryActions';
import Loader from 'app/components/Elements/Loader';
import Footer from 'app/App/Footer';
import {t} from 'app/I18N';

const documentsSelector = createSelector(s => s.library.documents, d => d.toJS());
const loadMoreAmmount = 30;

export class DocumentsList extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {loading: false};
  }

  loadMoreDocuments() {
    this.setState({loading: true});
    this.props.loadMoreDocuments(this.props.documents.rows.length + loadMoreAmmount);
  }

  componentWillReceiveProps() {
    this.setState({loading: false});
  }

  clickOnDocument(e, doc, active) {
    const canSelectMultiple = this.props.authorized;
    const specialkeyPressed = e.metaKey || e.ctrlKey || e.shiftKey;

    if (!specialkeyPressed || !canSelectMultiple) {
      this.props.unselectAllDocuments();
    }

    if (active && !specialkeyPressed || !canSelectMultiple) {
      return this.props.selectDocument(doc);
    }

    if (active) {
      return this.props.unselectDocument(doc.get('_id'));
    }

    if (!active & e.shiftKey & canSelectMultiple) {
      const lastSelectedDocument = this.props.selectedDocuments.last();
      const docs = this.props.documents.rows;
      const startIndex = docs.reduce((result, _doc, index) => {
        if (_doc._id === lastSelectedDocument.get('_id')) {
          return index;
        }
        return result;
      }, -1);

      const endIndex = docs.reduce((result, _doc, index) => {
        if (_doc._id === doc.get('_id')) {
          return index;
        }
        return result;
      }, -1);

      let docsToSelect = docs.slice(startIndex, endIndex + 1);
      if (endIndex < startIndex) {
        docsToSelect = docs.slice(endIndex, startIndex + 1);
      }
      return this.props.selectDocuments(docsToSelect);
    }

    this.props.selectDocument(doc);
  }

  render() {
    const documents = this.props.documents;

    return (
      <main className="document-viewer with-panel">
        <div className="main-wrapper">
          <div className="sort-by">
              <div className="u-floatLeft documents-counter">
                <span><b>{documents.totalRows}</b> {t('System', 'documents')}</span>
              </div>
              <SortButtons sortCallback={this.props.searchDocuments}
                           selectedTemplates={this.props.filters.get('documentTypes')} />
          </div>
          <RowList>
            {documents.rows.map((doc, index) => {
              return <Doc
                doc={Immutable(doc)}
                key={index}
                searchParams={this.props.search}
                onClick={this.clickOnDocument.bind(this)}
              />;
            })}
          </RowList>
          <div className="row">
            <div className="col-sm-12 text-center documents-counter">
                <b>{documents.rows.length}</b>
                {` ${t('System', 'of')} `}
                <b>{documents.totalRows}</b>
                {` ${t('System', 'documents')}`}
            </div>
            {(() => {
              if (documents.rows.length < documents.totalRows && !this.state.loading) {
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
          </div>
          <Footer/>
        </div>
      </main>
    );
  }
}

DocumentsList.propTypes = {
  documents: PropTypes.object.isRequired,
  filters: PropTypes.object,
  selectedDocuments: PropTypes.object,
  filtersPanel: PropTypes.bool,
  authorized: PropTypes.bool,
  multipleSelected: PropTypes.bool,
  search: PropTypes.object,
  loadMoreDocuments: PropTypes.func,
  searchDocuments: PropTypes.func,
  selectDocument: PropTypes.func,
  selectDocuments: PropTypes.func,
  unselectDocument: PropTypes.func,
  unselectAllDocuments: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    documents: documentsSelector(state),
    filters: state.library.filters,
    filtersPanel: state.library.ui.get('filtersPanel'),
    search: state.search,
    authorized: !!state.user.get('_id'),
    selectedDocuments: state.library.ui.get('selectedDocuments'),
    multipleSelected: state.library.ui.get('selectedDocuments').size > 1
  };
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadMoreDocuments, searchDocuments, selectDocument, selectDocuments, unselectDocument, unselectAllDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);

import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';
import {RowList} from 'app/Layout/Lists';
import {loadMoreDocuments} from 'app/Library/actions/libraryActions';
import Loader from 'app/components/Elements/Loader';
import Footer from 'app/App/Footer';
import {t} from 'app/I18N';

export class DocumentsList extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {loading: false};
  }

  loadMoreDocuments() {
    this.setState({loading: true});
    this.props.loadMoreDocuments(this.props.documents.toJS().rows.length + 12);
  }

  componentWillReceiveProps() {
    this.setState({loading: false});
  }

  render() {
    let documents = this.props.documents.toJS();
    return (
      <main className={'document-viewer ' + (this.props.filtersPanel || this.props.selectedDocument ? 'is-active' : '')}>
        <div className="main-wrapper">
        <div className="sort-by">

            <p id="documents-counter" className="u-floatLeft documents-counter">
              {`${documents.rows.length} ${t('System', 'of')} ${documents.totalRows} ${t('System', 'documents')}`}
            </p>
            <SortButtons />

        </div>
        <RowList>
          {documents.rows.map((doc, index) => <Doc doc={doc} key={index} />)}
        </RowList>
        <div className="row">
          <div className="col-sm-12 text-center documents-counter">
              {`${documents.rows.length} ${t('System', 'of')} ${documents.totalRows} ${t('System', 'documents')}`}
          </div>
          {(() => {
            if (documents.rows.length < documents.totalRows && !this.state.loading) {
              return <div className="col-sm-12 text-center">
              <button onClick={this.loadMoreDocuments.bind(this)} className="btn btn-default btn-load-more">{t('System', 'Load more')}</button>
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
  filtersPanel: PropTypes.bool,
  selectedDocument: PropTypes.object,
  loadMoreDocuments: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    documents: state.library.documents,
    filtersPanel: state.library.ui.get('filtersPanel'),
    selectedDocument: state.library.ui.get('selectedDocument')
  };
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadMoreDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);

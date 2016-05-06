import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import Doc from 'app/Library/components/Doc';
import {RowList} from 'app/Layout/Lists';

export class DocumentsList extends Component {

  render() {
    let documents = this.props.documents;
    return (
      <main className={'document-viewer col-sm-8 col-sm-offset-2 ' + (this.props.filtersPanel ? 'is-active' : '')}>
        <div className="sort-by">
          <div className="row">
            <h1 id="documents-counter" className="col-sm-7 page-title">1-12 of 39 documents for "africa"</h1>
            <p className="col-sm-5">
              Sort by
              <span className="active">
                A-Z
                <i className="fa fa-caret-down"></i>
              </span>
              <span>Upload date</span>
            </p>
          </div>
        </div>
        <RowList>
          {documents.map((doc, index) => <Doc {...doc.toJS()} key={index} />)}
        </RowList>
      </main>
    );
  }
}

DocumentsList.propTypes = {
  documents: PropTypes.object.isRequired,
  filtersPanel: PropTypes.bool
};

export function mapStateToProps(state) {
  return {
    documents: state.library.documents,
    filtersPanel: state.library.ui.get('filtersPanel')
  };
}

export default connect(mapStateToProps)(DocumentsList);

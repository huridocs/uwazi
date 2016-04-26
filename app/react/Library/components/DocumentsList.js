import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import 'app/Library/scss/DocumentsList.scss';
import Doc from 'app/Library/components/Doc';

export class DocumentsList extends Component {

  render() {
    let documents = this.props.documents;
    return (
        <main className="col-xs-12 col-sm-9">
          <div className="row">
            <p id="documents-counter" className="col-sm-5">1-12 of 39 documents</p>
            <p className="col-sm-7 sort-by">
              Sort by
              <span className="filter active">A-Z<i className="fa fa-caret-down"></i></span>
              <span className="filter">Upload date</span>
              <span className="filter">Relevance</span>
            </p>
          </div>
          <div className="item-group row">
              {documents.map((doc, index) => {
                return <Doc {...doc} key={index} />;
              })}
          </div>
        </main>
    );
  }
}

DocumentsList.propTypes = {
  documents: PropTypes.array.isRequired
};

export function mapStateToProps(state) {
  return {
    documents: state.library.documents.toJS()
  };
}

export default connect(mapStateToProps)(DocumentsList);

import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import 'app/Uploads/scss/uploads_list.scss';
import {RowList} from 'app/Layout/Lists';
import UploadDoc from 'app/Uploads/components/UploadDoc';


export class UploadsList extends Component {

  render() {
    const {documents} = this.props;

    return (
      <RowList>
        {documents.map((doc) => <UploadDoc doc={doc} key={doc.get('_id')}/>)}
      </RowList>
    );
  }
}

UploadsList.propTypes = {
  documents: PropTypes.object,
  progress: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    documents: state.uploads.documents
  };
}

export default connect(mapStateToProps)(UploadsList);

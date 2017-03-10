import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {RowList} from 'app/Layout/Lists';
import UploadDoc from 'app/Uploads/components/UploadDoc';
import UploadEntity from 'app/Uploads/components/UploadEntity';
import {conversionComplete, updateDocument} from 'app/Uploads/actions/uploadsActions';


export class UploadsList extends Component {

  componentWillMount() {
    this.props.socket.on('documentProcessed', (docId) => {
      this.props.conversionComplete(docId);
    });

    this.props.socket.on('conversionFailed', (docId) => {
      this.props.updateDocument({_id: docId, processed: false});
    });
  }

  render() {
    const documents = this.props.documents.sort((a, b) => b.get('creationDate') - a.get('creationDate'));

    return (
      <RowList>
        {documents.map(doc => {
          if (doc.get('type') === 'document') {
            return <UploadDoc doc={doc} key={doc.get('_id')}/>;
          }

          return <UploadEntity entity={doc} key={doc.get('_id')}/>;
        })}
      </RowList>
    );
  }
}

UploadsList.propTypes = {
  documents: PropTypes.object,
  progress: PropTypes.object,
  socket: PropTypes.object,
  conversionComplete: PropTypes.func,
  updateDocument: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    documents: state.uploads.documents,
    selectedDocuments: state.uploads.uiState.get('selectedDocuments')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({conversionComplete, updateDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadsList);

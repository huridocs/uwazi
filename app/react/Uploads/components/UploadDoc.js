import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {editDocument} from 'app/Uploads/actions/uploadsActions';

export class UploadDoc extends Component {
  render() {
    let doc = this.props.doc.toJS();

    let status = 'success';
    let message = 'Ready for publish';

    if (doc.uploaded === false) {
      status = 'danger';
      message = 'Upload failed';
    }

    let itsUploading = typeof this.props.progress === 'number';

    if (itsUploading) {
      status = 'info';
    }

    let active;
    if (this.props.documentBeingEdited) {
      active = this.props.documentBeingEdited === doc._id;
    }

    return (
      <RowList.Item status={status} active={active} onClick={() => this.props.editDocument(doc)}>
        <ItemName>{doc.title}</ItemName>
        <ItemFooter>
          {(() => {
            if (itsUploading) {
              return <ItemFooter.ProgressBar progress={this.props.progress} />;
            }
            return <ItemFooter.Label status={status}>{message}</ItemFooter.Label>;
          })()}
        </ItemFooter>
      </RowList.Item>
    );
  }
}

UploadDoc.propTypes = {
  doc: PropTypes.object,
  progress: PropTypes.number,
  editDocument: PropTypes.func,
  documentBeingEdited: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    progress: state.uploads.progress.get(props.doc.get('_id')),
    documentBeingEdited: state.uploads.uiState.get('documentBeingEdited')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({editDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadDoc);

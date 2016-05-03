import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {editDocument, finishEdit} from 'app/Uploads/actions/uploadsActions';
import {loadDocument} from 'app/DocumentForm/actions/actions';

export class UploadDoc extends Component {
  render() {
    let doc = this.props.doc.toJS();

    let status = 'success';
    let message = 'Ready for publish';

    if (!doc.template) {
      status = 'warning';
      message = 'Metadata required';
    }

    if (doc.uploaded === false) {
      status = 'danger';
      message = 'Upload failed';
    }

    if (!doc.processed && doc.uploaded) {
      status = 'info';
      message = 'Processing...';
    }

    if (doc.processed === false) {
      status = 'danger';
      message = 'Conversion failed';
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
      <RowList.Item status={status} active={active} onClick={() => {
        if (active) {
          return this.props.finishEdit();
        }
        this.props.loadDocument(doc, this.props.templates.toJS());
        this.props.editDocument(doc);
      }}>
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
  documentBeingEdited: PropTypes.string,
  loadDocument: PropTypes.func,
  finishEdit: PropTypes.func,
  templates: PropTypes.object
};

export function mapStateToProps(state, props) {
  return {
    progress: state.uploads.progress.get(props.doc.get('_id')),
    documentBeingEdited: state.uploads.uiState.get('documentBeingEdited'),
    templates: state.uploads.templates
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({finishEdit, editDocument, loadDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadDoc);

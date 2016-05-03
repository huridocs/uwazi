import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {editDocument, finishEdit} from 'app/Uploads/actions/uploadsActions';
import {loadDocument} from 'app/DocumentForm/actions/actions';
import {showModal} from 'app/Modals/actions/modalActions';

export class UploadDoc extends Component {
  showModal(modal, e) {
    if (modal) {
      e.stopPropagation();
      this.props.showModal(modal, this.props.doc);
    }
  }

  editDocument(doc, active) {
    if (active) {
      return this.props.finishEdit();
    }
    this.props.loadDocument(doc, this.props.templates.toJS());
    this.props.editDocument(doc);
  }

  render() {
    let doc = this.props.doc.toJS();
    let modal = false;

    let status = 'success';
    let message = 'Ready for publish';

    if (!doc.template) {
      status = 'warning';
      message = 'Metadata required';
      modal = 'metadataRequired';
    }

    if (doc.uploaded === false) {
      status = 'danger';
      message = 'Upload failed';
      modal = '';
    }

    if (!doc.processed && doc.uploaded) {
      status = 'info';
      message = 'Processing...';
      modal = '';
    }

    if (doc.processed === false) {
      status = 'danger';
      message = 'Conversion failed';
      modal = '';
    }

    let itsUploading = typeof this.props.progress === 'number';

    if (itsUploading) {
      status = 'info';
      modal = '';
    }

    let active;
    if (this.props.documentBeingEdited) {
      active = this.props.documentBeingEdited === doc._id;
    }

    return (
      <RowList.Item status={status} active={active} onClick={this.editDocument.bind(this, doc, active)}>
      <ItemName>{doc.title}</ItemName>
      <ItemFooter onClick={this.showModal.bind(this, modal)}>
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
  showModal: PropTypes.func,
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
  return bindActionCreators({finishEdit, editDocument, loadDocument, showModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadDoc);

import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {editDocument, finishEdit} from 'app/Uploads/actions/uploadsActions';
import {loadDocument} from 'app/Documents/actions/actions';
import {showModal} from 'app/Modals/actions/modalActions';
import {Link} from 'react-router';

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
    this.props.loadDocument('uploads.document', doc, this.props.templates.toJS());
    this.props.editDocument(doc);
  }

  render() {
    let doc = this.props.doc.toJS();
    let modal = 'readyToPublish';

    let status = 'success';
    let message = 'Ready to publish';
    let progress = 0;


    let itsProcessing = doc.uploaded && typeof doc.processed === 'undefined';

    if (itsProcessing) {
      status = 'info';
      message = 'Processing...';
      modal = '';
      progress = 100;
    }

    if (!doc.template && doc.processed) {
      status = 'warning';
      message = 'Metadata required';
      modal = '';
    }

    if (doc.uploaded && doc.processed === false) {
      status = 'danger';
      message = 'Conversion failed';
      modal = '';
    }

    if (doc.uploaded === false) {
      status = 'danger';
      message = 'Upload failed';
      modal = 'uploadFailed';
    }

    let itsUploading = typeof this.props.progress === 'number';

    if (itsUploading) {
      status = 'info';
      modal = '';
      progress = this.props.progress;
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
          if (itsUploading || itsProcessing) {
            return <ItemFooter.ProgressBar progress={progress} />;
          }
          if (doc.processed) {
            return <ItemFooter.Label status={status}>
                    {message}
                    <Link to={`/document/${doc._id}`} className="item-shortcut" onClick={(e) => e.stopPropagation()}>
                      <i className="fa fa-file-o"></i>
                    </Link>
                   </ItemFooter.Label>;
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

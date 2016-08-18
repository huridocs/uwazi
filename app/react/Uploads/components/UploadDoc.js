import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {edit, finishEdit} from 'app/Uploads/actions/uploadsActions';
import {showModal} from 'app/Modals/actions/modalActions';
import {Link} from 'react-router';
import {actions} from 'app/Metadata';

export class UploadDoc extends Component {
  showModal(modal, e) {
    if (modal) {
      e.stopPropagation();
      this.props.showModal(modal, this.props.doc);
    }
  }

  edit(doc, active) {
    if (active) {
      return this.props.finishEdit();
    }
    this.props.loadInReduxForm('uploads.metadata', doc, this.props.templates.toJS());
    this.props.edit(doc);
  }

  render() {
    let doc = this.props.doc.toJS();
    let modal = 'readyToPublish';

    let status = 'success';
    let message = 'Ready to publish';
    let progress = 0;


    let itsProcessing = doc.uploaded && typeof doc.processed === 'undefined';

    if (itsProcessing) {
      status = 'processing';
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
      status = 'processing';
      modal = '';
      progress = this.props.progress;
    }

    let active;
    if (this.props.metadataBeingEdited) {
      active = this.props.metadataBeingEdited._id === doc._id;
    }

    return (
      <RowList.Item status={status} active={active} onClick={this.edit.bind(this, doc, active)}>
      <div className="item-info">
        <ItemName>{doc.title}</ItemName>
      </div>
      <ItemFooter onClick={this.showModal.bind(this, modal)}>
        {(() => {
          if (itsUploading || itsProcessing) {
            return <ItemFooter.ProgressBar progress={progress} />;
          }
          if (doc.processed) {
            return <ItemFooter.Label status={status}>
                    {message}
                   </ItemFooter.Label>;
          }
          return <ItemFooter.Label status={status}>{message}</ItemFooter.Label>;
        })()}
        <Link to={`/document/${doc._id}`} className="item-shortcut" onClick={(e) => e.stopPropagation()}>
          <i className="fa fa-file-o"></i><span>View</span><i className="fa fa-angle-right"></i>
        </Link>
      </ItemFooter>
    </RowList.Item>
    );
  }
}

UploadDoc.propTypes = {
  doc: PropTypes.object,
  progress: PropTypes.number,
  edit: PropTypes.func,
  metadataBeingEdited: PropTypes.object,
  loadInReduxForm: PropTypes.func,
  finishEdit: PropTypes.func,
  showModal: PropTypes.func,
  templates: PropTypes.object
};

export function mapStateToProps(state, props) {
  return {
    progress: state.uploads.progress.get(props.doc.get('_id')),
    metadataBeingEdited: state.uploads.uiState.get('metadataBeingEdited'),
    templates: state.uploads.templates
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({finishEdit, edit, loadInReduxForm: actions.loadInReduxForm, showModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadDoc);

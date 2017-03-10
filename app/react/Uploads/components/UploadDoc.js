import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';
import {selectDocument, unselectAllDocuments, unselectDocument} from 'app/Uploads/actions/uploadsActions';
import {showModal} from 'app/Modals/actions/modalActions';
import {actions} from 'app/Metadata';
import {I18NLink} from 'app/I18N';
import {TemplateLabel, Icon} from 'app/Layout';

export class UploadDoc extends Component {
  showModal(modal, e) {
    if (modal) {
      e.stopPropagation();
      this.props.showModal(modal, this.props.doc);
    }
  }

  select(e) {
    if (!(e.metaKey || e.ctrlKey) || !this.props.authorized) {
      this.props.unselectAllDocuments();
    }

    if (this.props.active && this.props.multipleSelected && !(e.metaKey || e.ctrlKey)) {
      this.props.loadInReduxForm('uploads.metadata', this.props.doc, this.props.templates.toJS());
      return this.props.selectDocument(this.props.doc);
    }

    if (this.props.active) {
      return this.props.unselectDocument(this.props.doc.get('_id'));
    }

    this.props.selectDocument(this.props.doc);
    this.props.loadInReduxForm('uploads.metadata', this.props.doc.toJS(), this.props.templates.toJS());
  }

  render() {
    let doc = this.props.doc;
    let modal = 'readyToPublish';

    let status = 'success';
    let message = 'Ready to publish';
    let progress = 0;

    let itsProcessing = doc.get('uploaded') && typeof doc.get('processed') === 'undefined';

    if (itsProcessing) {
      status = 'processing';
      message = 'Processing...';
      modal = '';
      progress = 100;
    }

    if (!doc.get('template') && doc.get('processed')) {
      status = 'warning';
      message = 'Metadata required';
      modal = '';
    }

    if (doc.get('uploaded') && doc.get('processed') === false) {
      status = 'danger';
      message = 'Conversion failed';
      modal = '';
    }

    if (doc.get('uploaded') === false) {
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

<<<<<<< HEAD
    let active;
    if (this.props.metadataBeingEdited) {
      active = this.props.metadataBeingEdited._id === doc.get('_id');
    }

=======
>>>>>>> uploads working with multiple selection, missing the side panel WIP
    return (
      <RowList.Item status={status} active={this.props.active} onClick={this.select.bind(this)}>
      <div className="item-info">
        <i className="item-private-icon fa fa-lock"></i>
        <Icon className="item-icon item-icon-center" data={doc.get('icon')} />
        <ItemName>{doc.get('title')}</ItemName>
      </div>
      <ItemFooter>
        <div className="item-label-group">
          <TemplateLabel template={doc.get('template')}/>
          {(() => {
            if (itsUploading || itsProcessing) {
              return <ItemFooter.ProgressBar progress={progress} />;
            }
            if (doc.get('processed')) {
              return <ItemFooter.Label status={status}>
                      {message}
                     </ItemFooter.Label>;
            }
            return <ItemFooter.Label status={status}>{message}</ItemFooter.Label>;
          })()}
        </div>
        <div className="item-shortcut-group">
          <a className="item-shortcut item-shortcut--success" onClick={this.showModal.bind(this, modal)}>
            <span className="itemShortcut-arrow">
              <i className="fa fa-send"></i>
            </span>
          </a>
          &nbsp;
          <I18NLink to={`/document/${doc.get('sharedId')}`} className="item-shortcut" onClick={(e) => e.stopPropagation()}>
            <span className="itemShortcut-arrow">
              <i className="fa fa-file-text-o"></i>
            </span>
          </I18NLink>
        </div>
      </ItemFooter>
    </RowList.Item>
    );
  }
}

UploadDoc.propTypes = {
  doc: PropTypes.object,
  progress: PropTypes.number,
  selectDocument: PropTypes.func,
  unselectDocument: PropTypes.func,
  active: PropTypes.bool,
  authorized: PropTypes.bool,
  multipleSelected: PropTypes.bool,
  loadInReduxForm: PropTypes.func,
  unselectAllDocuments: PropTypes.func,
  showModal: PropTypes.func,
  templates: PropTypes.object
};

export function mapStateToProps({uploads, templates, user}, props) {
  return {
    active: !!uploads.uiState.get('selectedDocuments').find((doc) => doc.get('_id') === props.doc.get('_id')),
    multipleSelected: uploads.uiState.get('selectedDocuments').size > 1,
    progress: uploads.progress.get(props.doc.get('sharedId')),
    templates,
    authorized: !!user.get('_id')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectAllDocuments, selectDocument, unselectDocument, loadInReduxForm: actions.loadInReduxForm, showModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadDoc);

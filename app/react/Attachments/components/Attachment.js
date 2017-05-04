import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import filesize from 'filesize';
import {NeedAuthorization} from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import t from 'app/I18N/t';

import {deleteAttachment, renameAttachment, loadForm, submitForm, resetForm} from '../actions/actions';
import UploadButton from 'app/Metadata/components/UploadButton';
import AttachmentForm from 'app/Attachments/components/AttachmentForm';

export class Attachment extends Component {

  deleteAttachment(attachment) {
    this.context.confirm({
      accept: () => {
        this.props.deleteAttachment(this.props.parentId, attachment);
      },
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this attachment?'
    });
  }

  getExtension(filename) {
    return filename.substr(filename.lastIndexOf('.') + 1);
  }

  getItemOptions(isSourceDocument, parentId, filename) {
    const options = {};
    options.itemClassName = isSourceDocument ? 'item-source-document' : '';
    options.typeClassName = isSourceDocument ? 'primary' : 'empty';
    options.icon = isSourceDocument ? 'file-pdf-o' : 'paperclip';
    options.deletable = !isSourceDocument;
    options.replaceable = isSourceDocument;
    options.downloadHref = isSourceDocument ?
                         `/api/documents/download?_id=${parentId}` :
                         `/api/attachments/download?_id=${parentId}&file=${filename}`;

    return options;
  }

  render() {
    const {file, parentId, parentSharedId, model, isSourceDocument} = this.props;
    const sizeString = file.size ? filesize(file.size) : '';
    const item = this.getItemOptions(isSourceDocument, parentId, file.filename);

    let name = <div className="item-info">
                 <div className="item-name">{file.originalname}</div>
               </div>;

    let buttons = <div className="item-shortcut-group">
                    <NeedAuthorization>
                      <ShowIf if={!this.props.readOnly}>
                        <a className="item-shortcut btn btn-default" onClick={this.props.loadForm.bind(this, model, file)}>
                          <i className="fa fa-pencil"></i>
                        </a>
                      </ShowIf>
                    </NeedAuthorization>
                    <NeedAuthorization>
                      <ShowIf if={item.deletable && !this.props.readOnly}>
                        <a className="item-shortcut btn btn-default btn-hover-danger" onClick={this.deleteAttachment.bind(this, file)}>
                          <i className="fa fa-trash"></i>
                        </a>
                      </ShowIf>
                    </NeedAuthorization>
                    <NeedAuthorization>
                      <ShowIf if={item.replaceable && !this.props.readOnly}>
                        <UploadButton documentId={parentId} documentSharedId={parentSharedId} />
                      </ShowIf>
                    </NeedAuthorization>
                    <a className="item-shortcut btn btn-default"
                      href={item.downloadHref}
                      target="_blank">
                      <i className="fa fa-download"></i>
                    </a>
                  </div>;

    if (this.props.beingEdited && !this.props.readOnly) {
      name = <AttachmentForm model={this.props.model} onSubmit={this.props.renameAttachment.bind(this, parentId, model)}/>;
      buttons = <div className="item-shortcut-group">
                  <NeedAuthorization>
                    <a className="item-shortcut btn btn-primary" onClick={this.props.resetForm.bind(this, model)}>
                      <i className="fa fa-close"></i>
                    </a>
                  </NeedAuthorization>
                  <NeedAuthorization>
                    <a className="item-shortcut btn btn-success" onClick={this.props.submitForm.bind(this, model)}>
                      <i className="fa fa-floppy-o"></i>
                    </a>
                  </NeedAuthorization>
                </div>;
    }


    return (
      <div className={`item highlight-hover ${item.itemClassName}`}>

        {name}

        <ShowIf if={Boolean(sizeString)}>
          <div className="item-metadata">
            <dl>
              <dt>{t('System', 'Size')}</dt>
              <dd>{sizeString}</dd>
            </dl>
          </div>
        </ShowIf>

        <div className="item-actions">
          <div className="item-label-group">
            <span className={`item-type item-type-${item.typeClassName}`}>
              <i className={`fa fa-${item.icon} item-type__icon`}></i>
              <span className="item-type__name">{this.getExtension(file.filename)}</span>
              <ShowIf if={isSourceDocument}>
                <span className="label label-success">
                  <ShowIf if={!this.props.readOnly}>
                    <span>
                      <i className="fa fa-arrow-left"></i>
                      <span>You are reading this document</span>
                    </span>
                  </ShowIf>
                </span>
              </ShowIf>
            </span>
          </div>

          {buttons}
        </div>
      </div>
    );
  }
}

Attachment.propTypes = {
  file: PropTypes.object,
  parentId: PropTypes.string,
  model: PropTypes.string,
  parentSharedId: PropTypes.string,
  readOnly: PropTypes.bool,
  isSourceDocument: PropTypes.bool,
  beingEdited: PropTypes.bool,
  deleteAttachment: PropTypes.func,
  renameAttachment: PropTypes.func,
  loadForm: PropTypes.func,
  submitForm: PropTypes.func,
  resetForm: PropTypes.func
};

Attachment.contextTypes = {
  confirm: PropTypes.func
};

export function mapStateToProps({attachments}, ownProps) {
  return {
    model: 'attachments.edit.attachment',
    beingEdited: ownProps.file._id && attachments.edit.attachment._id === ownProps.file._id
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({deleteAttachment, renameAttachment, loadForm, submitForm, resetForm}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Attachment);

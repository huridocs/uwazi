import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import filesize from 'filesize';
import {NeedAuthorization} from 'app/Auth';
import ShowIf from 'app/App/ShowIf';

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

  getItemOptions(isSourceDocument, parentId, filename, originalname) {
    const options = {};
    options.itemClassName = isSourceDocument ? 'item-source-document' : '';
    options.typeClassName = isSourceDocument ? 'primary' : 'empty';
    options.icon = isSourceDocument ? 'file-pdf-o' : 'paperclip';
    options.deletable = !isSourceDocument;
    options.replaceable = isSourceDocument;
    options.downloadHref = isSourceDocument ?
                           `/api/documents/download?_id=${parentId}&originalname=${originalname}` :
                           `/api/attachments/download?_id=${parentId}&file=${filename}`;

    return options;
  }

  conformThumbnail(file, item) {
    const acceptedThumbnailExtensions = ['png', 'gif', 'jpg'];
    return (
      <div className="attachment-thumbnail">
        <ShowIf if={this.getExtension(file.filename) === 'pdf'}>
          <span><i className="fa fa-file-pdf-o"></i> pdf</span>
        </ShowIf>
        <ShowIf if={acceptedThumbnailExtensions.indexOf(this.getExtension(file.filename)) !== -1}>
          <img src={item.downloadHref} />
        </ShowIf>
      </div>
    );
  }

  render() {
    const {file, parentId, parentSharedId, model, isSourceDocument} = this.props;
    const sizeString = file.size ? filesize(file.size) : '';
    const item = this.getItemOptions(isSourceDocument, parentId, file.filename, file.originalname);

    let name = <a className="attachment-link" href={item.downloadHref}>
                {this.conformThumbnail(file, item)}
                <span className="attachment-name">
                  <span>{file.originalname}</span>
                  <ShowIf if={Boolean(sizeString)}>
                    <span className="attachment-size">{sizeString}</span>
                  </ShowIf>
                </span>
               </a>;

    let buttons = <div>
                    <NeedAuthorization roles={['admin', 'editor']}>
                      <div className="attachment-buttons">
                        <ShowIf if={!this.props.readOnly}>
                          <a className="item-shortcut btn btn-default" onClick={this.props.loadForm.bind(this, model, file)}>
                            <i className="fa fa-pencil"></i>
                          </a>
                        </ShowIf>
                        <ShowIf if={item.deletable && !this.props.readOnly}>
                          <a className="item-shortcut btn btn-default btn-hover-danger" onClick={this.deleteAttachment.bind(this, file)}>
                            <i className="fa fa-trash"></i>
                          </a>
                        </ShowIf>
                        <ShowIf if={item.replaceable && !this.props.readOnly}>
                          <UploadButton documentId={parentId} documentSharedId={parentSharedId} />
                        </ShowIf>
                      </div>
                    </NeedAuthorization>
                  </div>;

    if (this.props.beingEdited && !this.props.readOnly) {
      name = <div className="attachment-link">
              {this.conformThumbnail(file, item)}
              <span className="attachment-name">
                <AttachmentForm model={this.props.model} onSubmit={this.props.renameAttachment.bind(this, parentId, model)}/>
              </span>
             </div>;

      buttons = <div className="attachment-buttons">
                  <div className="item-shortcut-group">
                    <NeedAuthorization roles={['admin', 'editor']}>
                      <a className="item-shortcut btn btn-primary" onClick={this.props.resetForm.bind(this, model)}>
                        <i className="fa fa-close"></i>
                      </a>
                    </NeedAuthorization>
                    <NeedAuthorization roles={['admin', 'editor']}>
                      <a className="item-shortcut btn btn-success" onClick={this.props.submitForm.bind(this, model)}>
                        <i className="fa fa-floppy-o"></i>
                      </a>
                    </NeedAuthorization>
                  </div>
                </div>;
    }


    return (
      <div className="attachment">
        {name}
        {buttons}
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

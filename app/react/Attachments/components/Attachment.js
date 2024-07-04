import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { filesize } from 'filesize';
import { Icon } from 'UI';
import { withContext } from 'app/componentWrappers';
import { NeedAuthorization } from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import { Translate, t } from 'app/I18N';
import AttachmentForm from 'app/Attachments/components/AttachmentForm';
import { wrapDispatch } from 'app/Multireducer';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { store } from 'app/store';
import { getFileExtension } from 'app/utils/getFileExtension';

import {
  deleteAttachment,
  renameAttachment,
  loadForm,
  submitForm,
  resetForm,
} from '../actions/actions';

const getItemOptions = (filename, url) => {
  const options = {};
  options.itemClassName = '';
  options.typeClassName = 'empty';
  options.icon = 'paperclip';
  options.deletable = true;
  options.replaceable = false;
  options.downloadHref = `/api/files/${filename}`;
  options.url = url;

  return options;
};

class Attachment extends Component {
  static conformThumbnail(file, item) {
    const acceptedThumbnailExtensions = ['png', 'gif', 'jpg', 'jpeg'];
    let thumbnail = null;

    if (file.filename && getFileExtension(file.filename) === 'pdf') {
      thumbnail = (
        <span no-translate>
          <Icon icon="file-pdf" /> pdf
        </span>
      );
    }

    if (file.url) {
      thumbnail = (
        <span>
          <Icon icon="link" />
        </span>
      );
    }

    if (
      file.filename &&
      acceptedThumbnailExtensions.indexOf(getFileExtension(file.filename.toLowerCase())) !== -1
    ) {
      thumbnail = <img src={item.downloadHref} alt={file.filename} />;
    }

    return <div className="attachment-thumbnail">{thumbnail}</div>;
  }

  constructor(props) {
    super(props);
    this.state = { dropdownMenuOpen: false };

    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.attachmentActionsRef = React.createRef();
    this.onRenameSubmit = this.onRenameSubmit.bind(this);
    this.toggleRename = this.toggleRename.bind(this);
  }

  componentDidMount() {
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', this.handleClickOutside);
    }
  }

  componentWillUnmount() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousedown', this.handleClickOutside);
    }
  }

  onRenameSubmit(newFile) {
    const { parentSharedId, model, storeKey } = this.props;
    this.props.renameAttachment(parentSharedId, model, storeKey, newFile);
  }

  toggleDropdown() {
    this.setState(prevState => ({
      dropdownMenuOpen: !prevState.dropdownMenuOpen,
    }));
  }

  deleteAttachment(attachment) {
    this.props.mainContext.confirm({
      accept: () => {
        this.props.deleteAttachment(this.props.parentSharedId, attachment, this.props.storeKey);
      },
      title: 'Confirm delete',
      message: this.props.deleteMessage,
    });
  }

  toggleRename() {
    const { file, model } = this.props;
    this.props.loadForm.bind(this, model, file)();
    this.toggleDropdown();
  }

  copyToClipboard(item) {
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = item.url || window.location.origin + item.downloadHref;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);

    store.dispatch(notify(t('System', 'Copied to clipboard', null, false), 'success'));
    this.toggleDropdown();
  }

  handleClickOutside(e) {
    if (
      this.attachmentActionsRef.current &&
      !this.attachmentActionsRef.current.contains(e.target)
    ) {
      this.setState({ dropdownMenuOpen: false });
    }
  }

  render() {
    const { file, model, storeKey, entity } = this.props;
    const sizeString = file.size ? filesize(file.size) : '';
    const item = getItemOptions(file.filename, file.url);
    let name = (
      <a
        className="attachment-link"
        href={item.url || item.downloadHref}
        download
        target="_blank"
        rel="noopener noreferrer"
      >
        {Attachment.conformThumbnail(file, item)}
        <span className="attachment-name">
          <span>{file.originalname}</span>
          <ShowIf if={Boolean(sizeString)}>
            <span className="attachment-size">{sizeString}</span>
          </ShowIf>
        </span>
      </a>
    );

    let buttons = null;

    if (this.props.beingEdited && !this.props.readOnly) {
      name = (
        <div className="attachment-link">
          {Attachment.conformThumbnail(file, item)}
          <span className="attachment-name">
            <AttachmentForm model={this.props.model} onSubmit={this.onRenameSubmit} />
          </span>
        </div>
      );

      buttons = (
        <div className="attachment-buttons">
          <div className="item-shortcut-group">
            <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
              <button
                type="button"
                className="item-shortcut btn btn-primary"
                onClick={this.props.resetForm.bind(this, model)}
              >
                <Icon icon="times" />
              </button>
            </NeedAuthorization>
            <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
              <button
                type="button"
                className="item-shortcut btn btn-success"
                onClick={this.props.submitForm.bind(this, model, storeKey)}
              >
                <Icon icon="save" />
              </button>
            </NeedAuthorization>
          </div>
        </div>
      );
    }

    return (
      <div className="attachment">
        {name}
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
          {buttons}

          <div className="dropdown attachments-dropdown">
            <button
              className="btn btn-default dropdown-toggle attachments-dropdown-toggle"
              type="button"
              id="attachment-dropdown-actions"
              data-toggle="dropdown"
              aria-haspopup="true"
              onClick={this.toggleDropdown}
            >
              <Icon icon="ellipsis-h" />
            </button>
            <ul
              className="dropdown-menu dropdown-menu-right"
              aria-labelledby="attachment-dropdown-actions"
              style={{ display: this.state.dropdownMenuOpen ? 'block' : 'none' }}
              ref={this.attachmentActionsRef}
            >
              <li>
                <button type="button" onClick={() => this.copyToClipboard(item)}>
                  <Icon icon="link" /> <Translate>Copy link</Translate>
                </button>
              </li>
              <li>
                <a
                  href={item.url || item.downloadHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Icon icon="cloud-download-alt" /> <Translate>Download</Translate>
                </a>
              </li>
              {!this.props.readOnly && (
                <>
                  <li>
                    <button type="button" onClick={this.toggleRename}>
                      <Icon icon="font" /> <Translate>Rename</Translate>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={this.deleteAttachment.bind(this, file)}
                      className="is--delete"
                    >
                      <Icon icon="trash-alt" /> <Translate>Delete</Translate>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </NeedAuthorization>
      </div>
    );
  }
}

Attachment.defaultProps = {
  deleteMessage: 'Are you sure you want to delete this attachment?',
  entity: null,
};

Attachment.propTypes = {
  deleteMessage: PropTypes.string,
  file: PropTypes.object,
  parentSharedId: PropTypes.string,
  storeKey: PropTypes.string,
  model: PropTypes.string,
  readOnly: PropTypes.bool,
  beingEdited: PropTypes.bool,
  deleteAttachment: PropTypes.func,
  renameAttachment: PropTypes.func,
  loadForm: PropTypes.func,
  submitForm: PropTypes.func,
  resetForm: PropTypes.func,
  entity: PropTypes.object,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    { deleteAttachment, renameAttachment, loadForm, submitForm, resetForm },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export function mapStateToProps({ attachments }, ownProps) {
  return {
    model: 'attachments.edit.attachment',
    beingEdited: ownProps.file._id && attachments.edit.attachment._id === ownProps.file._id,
  };
}

export { Attachment };
export default connect(mapStateToProps, mapDispatchToProps)(withContext(Attachment));

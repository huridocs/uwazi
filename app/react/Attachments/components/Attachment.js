import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import filesize from 'filesize';

import { NeedAuthorization } from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import { Translate } from 'app/I18N';
import AttachmentForm from 'app/Attachments/components/AttachmentForm';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'UI';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { store } from 'app/store';

import {
  deleteAttachment,
  renameAttachment,
  loadForm,
  submitForm,
  resetForm,
} from '../actions/actions';

const getExtension = filename => (filename ? filename.substr(filename.lastIndexOf('.') + 1) : '');

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

const conformThumbnail = (file, item) => {
  const acceptedThumbnailExtensions = ['png', 'gif', 'jpg', 'jpeg'];
  let thumbnail = null;

  if (getExtension(file.filename) === 'pdf') {
    thumbnail = (
      <span>
        <Icon icon="file-pdf" /> pdf
      </span>
    );
  }

  if (acceptedThumbnailExtensions.indexOf(getExtension(file.filename.toLowerCase())) !== -1) {
    thumbnail = <img src={item.downloadHref} alt={file.filename} />;
  }

  return <div className="attachment-thumbnail">{thumbnail}</div>;
};

export class Attachment extends Component {
  constructor(props) {
    super(props);
    this.state = { dropdownMenuOpen: false };

    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.myRef = React.createRef();
    this.onRenameSubmit = this.onRenameSubmit.bind(this);
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
    this.context.confirm({
      accept: () => {
        this.props.deleteAttachment(this.props.parentSharedId, attachment, this.props.storeKey);
      },
      title: 'Confirm delete',
      message: this.props.deleteMessage,
    });
  }

  toggleRename(model, file) {
    this.props.loadForm.bind(this, model, file)();
    this.toggleDropdown();
  }

  copyToClipboard(item, event) {
    event.preventDefault();
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = item.url || window.location.origin + item.downloadHref;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);

    store.dispatch(notify('Copied to clipboard', 'success'));
    this.toggleDropdown();
  }

  handleClickOutside(e) {
    if (!this.myRef.current.contains(e.target)) {
      this.setState({ dropdownMenuOpen: false });
    }
  }

  render() {
    const { file, parentId, model, storeKey } = this.props;
    const sizeString = file.size ? filesize(file.size) : '';
    const item = getItemOptions(file.filename, file.url);
    let name = (
      <a className="attachment-link" href={item.url || item.downloadHref}>
        {file.filename ? conformThumbnail(file, item) : null}
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
          {file.filename ? conformThumbnail(file, item) : null}
          <span className="attachment-name">
            <AttachmentForm model={this.props.model} onSubmit={this.onRenameSubmit} />
          </span>
        </div>
      );

      buttons = (
        <div className="attachment-buttons">
          <div className="item-shortcut-group">
            <NeedAuthorization roles={['admin', 'editor']}>
              <button
                type="button"
                className="item-shortcut btn btn-primary"
                onClick={this.props.resetForm.bind(this, model)}
              >
                <Icon icon="times" />
              </button>
            </NeedAuthorization>
            <NeedAuthorization roles={['admin', 'editor']}>
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
        <NeedAuthorization roles={['admin', 'editor']}>
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
              <Icon icon="pencil-alt" />
            </button>
            <ul
              className="dropdown-menu dropdown-menu-right"
              aria-labelledby="attachment-dropdown-actions"
              style={{ display: this.state.dropdownMenuOpen ? 'block' : 'none' }}
              ref={this.myRef}
            >
              <li>
                <a href="#" onClick={e => this.copyToClipboard(item, e)}>
                  <Icon icon="link" /> <Translate>Copy link</Translate>
                </a>
              </li>
              <li>
                <a href={item.url || item.downloadHref} target="_blank">
                  <Icon icon="link" /> <Translate>Download</Translate>
                </a>
              </li>
              <li>
                <a href="#" onClick={this.toggleRename.bind(this, model, file)}>
                  <Icon icon="pencil-alt" /> <Translate>Rename</Translate>
                </a>
              </li>
              <li>
                <a href="#" onClick={this.deleteAttachment.bind(this, file)} className="is--delete">
                  <Icon icon="trash-alt" /> <Translate>Delete</Translate>
                </a>
              </li>
            </ul>
          </div>
        </NeedAuthorization>
      </div>
    );
  }
}

Attachment.defaultProps = {
  deleteMessage: 'Are you sure you want to delete this attachment?',
};

Attachment.propTypes = {
  deleteMessage: PropTypes.string,
  file: PropTypes.object,
  parentId: PropTypes.string,
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
};

Attachment.contextTypes = {
  confirm: PropTypes.func,
};

export function mapStateToProps({ attachments }, ownProps) {
  return {
    model: 'attachments.edit.attachment',
    beingEdited: ownProps.file._id && attachments.edit.attachment._id === ownProps.file._id,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    { deleteAttachment, renameAttachment, loadForm, submitForm, resetForm },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(Attachment);

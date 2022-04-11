import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import t from 'app/I18N/t';
import { Icon } from 'UI';

import { uploadAttachment } from '../actions/actions';

export class UploadAttachment extends Component {
  onChangeSingle(e) {
    const file = e.target.files[0];
    this.props.uploadAttachment(this.props.entity, file, { __reducerKey: this.props.storeKey });
  }

  onChangeAll(e) {
    const file = e.target.files[0];
    this.props.uploadAttachment(
      this.props.entity,
      file,
      { __reducerKey: this.props.storeKey },
      {
        allLanguages: true,
      }
    );
  }

  renderUploadButton() {
    let uploadToAll = null;

    if (this.props.languages.size > 1) {
      uploadToAll = (
        <label htmlFor="upload-attachment-all-input" className="btn btn-success btn-xs add">
          <span className="btn-label">
            <Icon icon="link" /> {t('System', 'Add to all languages')}
          </span>
          <input
            onChange={this.onChangeAll.bind(this)}
            type="file"
            id="upload-attachment-all-input"
          />
        </label>
      );
    }

    return (
      <div>
        <label htmlFor="upload-attachment-input" className="btn btn-success btn-xs add">
          <span className="btn-label">
            <Icon icon="paperclip" /> {t('System', 'Add file')}
          </span>
          <input
            onChange={this.onChangeSingle.bind(this)}
            type="file"
            id="upload-attachment-input"
          />
        </label>
        {uploadToAll}
      </div>
    );
  }

  renderProgress(progress) {
    return (
      <div className="btn btn-default btn-disabled">
        <span className="btn-label">{t('System', 'Uploading')}</span>
        <span>&nbsp;&nbsp;{progress}%</span>
      </div>
    );
  }

  render() {
    const progress = this.props.progress.get(this.props.entity);
    return progress ? this.renderProgress(progress) : this.renderUploadButton();
  }
}

UploadAttachment.propTypes = {
  uploadAttachment: PropTypes.func,
  entity: PropTypes.string,
  progress: PropTypes.object,
  languages: PropTypes.object,
  storeKey: PropTypes.string,
};

export function mapStateToProps({ attachments, settings }) {
  return {
    progress: attachments.progress,
    languages: settings.collection.get('languages'),
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({ uploadAttachment }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadAttachment);

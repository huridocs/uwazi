import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import t from 'app/I18N/t';

import {uploadAttachment} from '../actions/actions';

export class UploadAttachment extends Component {
  onChange(e) {
    let file = e.target.files[0];
    this.props.uploadAttachment(this.props.entityId, file);
  }

  renderUploadButton() {
    return (
      <label htmlFor="upload-attachment-input" className="btn btn-primary">
        <i className="fa fa-cloud-upload"></i>
        <span className="btn-label">{t('System', 'Upload')}</span>
        <input onChange={this.onChange.bind(this)} type="file" id="upload-attachment-input" style={{display: 'none'}} />
      </label>
    );
  }

  renderProgress(progress) {
    return (
      <div className="btn btn-warning">
        <i className="fa">{progress}%</i>
        <span className="btn-label">{t('System', 'Uploading')}</span>
      </div>
    );
  }


  render() {
    let progress;
    // let progress = this.props.progress.get(this.props.documentId);
    if (progress) {
      return this.renderProgress(progress);
    }
    return this.renderUploadButton();
  }
}

UploadAttachment.propTypes = {
  uploadAttachment: PropTypes.func,
  entityId: PropTypes.string
};

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({uploadAttachment}, dispatch);
}

export default connect(null, mapDispatchToProps)(UploadAttachment);

import PropTypes from 'prop-types';
import React, {Component} from 'react';
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
      <label htmlFor="upload-attachment-input" className="btn btn-success">
        <i className="fa fa-paperclip"></i>
        <span className="btn-label">{t('System', 'Add')}</span>
        <input onChange={this.onChange.bind(this)} type="file" id="upload-attachment-input" style={{display: 'none'}} />
      </label>
    );
  }

  renderProgress(progress) {
    return (
      <div className="btn btn-default btn-disabled">
        <span>{progress}%</span>
        <span className="btn-label">{t('System', 'Uploading')}</span>
      </div>
    );
  }

  render() {
    const progress = this.props.progress.get(this.props.entityId);
    if (progress) {
      return this.renderProgress(progress);
    }
    return this.renderUploadButton();
  }
}

UploadAttachment.propTypes = {
  uploadAttachment: PropTypes.func,
  entityId: PropTypes.string,
  progress: PropTypes.object
};

export function mapStateToProps({attachments}) {
  return {progress: attachments.progress};
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({uploadAttachment}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadAttachment);

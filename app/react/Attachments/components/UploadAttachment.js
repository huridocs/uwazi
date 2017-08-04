import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import t from 'app/I18N/t';

import {uploadAttachment} from '../actions/actions';

export class UploadAttachment extends Component {
  onChangeSingle(e) {
    let file = e.target.files[0];
    this.props.uploadAttachment(this.props.entityId, file, this.props.storeKey);
  }

  // TEST!!!!
  onChangeAll(e) {
    let file = e.target.files[0];
    this.props.uploadAttachment(this.props.entityId, file, this.props.storeKey, {allLanguages: true});
  }

  renderUploadButton() {
    return (
      <div>
        <label htmlFor="upload-attachment-input" className="btn btn-success btn-xs add">
          <span className="btn-label"><i className="fa fa-paperclip"></i>&nbsp;&nbsp;{t('System', 'Add file')}</span>
          <input onChange={this.onChangeSingle.bind(this)} type="file" id="upload-attachment-input" style={{display: 'none'}} />
        </label>
        &nbsp;
        <label htmlFor="upload-attachment-all-input" className="btn btn-success btn-xs add">
          <span className="btn-label"><i className="fa fa-link"></i>&nbsp;&nbsp;{t('System', 'Add to all languages')}</span>
          <input onChange={this.onChangeAll.bind(this)} type="file" id="upload-attachment-all-input" style={{display: 'none'}} />
        </label>
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
  progress: PropTypes.object,
  storeKey: PropTypes.string
};

export function mapStateToProps({attachments}) {
  return {progress: attachments.progress};
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({uploadAttachment}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadAttachment);

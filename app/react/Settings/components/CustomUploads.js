import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { t } from 'app/I18N';

import { uploadCustom } from '../../Uploads/actions/uploadsActions';

export class CustomUploads extends Component {
  onDrop(files) {
    files.forEach((file) => {
      this.props.upload(file);
    });
  }
  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Custom Uploads')}</div>
        <div className="panel-body">
          <Dropzone
            className="upload-box"
            onDrop={this.onDrop.bind(this)}
          >
            <div className="upload-box_wrapper">
              <i className="fa fa-upload" />
              <a className="upload-box_link">Browse files to upload</a>
              <span> or drop your files here.</span>
            </div>
            <div className="protip">
              <i className="fa fa-lightbulb-o" />
            </div>
          </Dropzone>
        </div>
        {this.props.progress && <p>Uploading ...</p>}
        <ul>
          {this.props.customUploads.map((upload) => {
            return <li>{`/uploaded_documents/${upload.get('filename')}`}</li>;
          })}
        </ul>
      </div>
    );
  }
}

CustomUploads.defaultProps = {
  progress: false
};

CustomUploads.propTypes = {
  progress: PropTypes.bool,
  upload: PropTypes.func.isRequired
};

export const mapStateToProps = ({ customUploads, progress }) => ({
    customUploads,
    progress: !!progress.filter((v, key) => key.match(/customUpload/)).size
});

const mapDispatchToProps = dispatch => bindActionCreators({ upload: uploadCustom }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CustomUploads);

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { t } from 'app/I18N';

import { upload } from '../../Uploads/actions/uploadsActions';

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
            style={{}}
          >
            <div className="upload-box_wrapper">
              <i className="fa fa-upload" />
              <a className="upload-box_link">Browse your PDFs to upload</a>
              <span> or drop your files here.</span>
            </div>
            <div className="protip">
              <i className="fa fa-lightbulb-o" />
              <b>ProTip!</b>
              <span>For better performance, upload your documents in batches of 50 or less.</span>
            </div>
          </Dropzone>
        </div>
      </div>
    );
  }
}

CustomUploads.propTypes = {
  upload: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});
const mapDispatchToProps = dispatch => bindActionCreators({ upload }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CustomUploads);

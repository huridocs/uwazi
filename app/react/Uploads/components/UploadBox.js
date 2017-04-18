import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Dropzone from 'react-dropzone';

import {uploadDocument, unselectAllDocuments, createDocument} from 'app/Uploads/actions/uploadsActions';

export class UploadBox extends Component {
  onDrop(files) {
    files.forEach((file) => {
      let doc = {title: this.extractTitle(file)};
      this.props.createDocument(doc)
      .then((newDoc) => {
        this.props.uploadDocument(newDoc.sharedId, file);
      });
    });
    this.props.unselectAllDocuments();
  }

  extractTitle(file) {
    let title = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/ {2}/g, ' ');

    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  render() {
    return (
      <Dropzone style={{}} onDrop={this.onDrop.bind(this)} accept="application/pdf">
        <div className="upload-box">
          <div className="upload-box_wrapper">
            <i className="upload-box_icon fa fa-upload"></i>
            <p className="upload-box_title">
              <span>Drag and drop your files</span>
            </p>
            <a className="upload-box_link">
              <span className="upload-box_or">or</span>
              <b className="upload-box_cta">Click here for browsing your local files</b>
            </a>
            <span className="upload-box_formats">Supported formats: PDF</span>
          </div>
        </div>
      </Dropzone>
    );
  }
}

UploadBox.propTypes = {
  uploadDocument: PropTypes.func,
  createDocument: PropTypes.func,
  unselectAllDocuments: PropTypes.func
};


function mapDispatchToProps(dispatch) {
  return bindActionCreators({uploadDocument, unselectAllDocuments, createDocument}, dispatch);
}

export default connect(null, mapDispatchToProps)(UploadBox);

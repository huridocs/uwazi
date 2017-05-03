import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Dropzone from 'react-dropzone';
import {wrapDispatch} from 'app/Multireducer';

import {uploadDocument, createDocument, documentProcessed, documentProcessError} from 'app/Uploads/actions/uploadsActions';
import {unselectAllDocuments} from 'app/Library/actions/libraryActions';
import io from 'socket.io-client';

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

  componentWillMount() {
    this.socket = io();
    this.socket.on('documentProcessed', (sharedId) => {
      this.props.documentProcessed(sharedId);
    });

    this.socket.on('conversionFailed', (sharedId) => {
      this.props.documentProcessError(sharedId);
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
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
      <Dropzone className="upload-box"
                style={{}} onDrop={this.onDrop.bind(this)} accept="application/pdf">
        <div className="upload-box_wrapper">
          <i className="fa fa-upload"></i>
          <a className="upload-box_link">Browse your PDFs to upload</a>
          <span> or drop your files here.</span>
        </div>
        <div className="protip">
          <i className="fa fa-lightbulb-o"></i>
          <b>ProTip!</b>
          <span>For better performance, upload your documents in batches of 50 or less.</span>
        </div>
      </Dropzone>
    );
  }
}

UploadBox.propTypes = {
  documentProcessed: PropTypes.func,
  documentProcessError: PropTypes.func,
  uploadDocument: PropTypes.func,
  createDocument: PropTypes.func,
  unselectAllDocuments: PropTypes.func,
  documents: PropTypes.object
};

export function mapStateToProps({uploads}) {
  return {
    documents: uploads.documents
  };
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    uploadDocument, unselectAllDocuments, createDocument, documentProcessed, documentProcessError
  }, wrapDispatch(dispatch, 'uploads'));
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadBox);

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';
import {
  uploadDocument,
  createDocument,
  documentProcessed,
  documentProcessError,
} from 'app/Uploads/actions/uploadsActions';
import { wrapDispatch } from 'app/Multireducer';
import socket from 'app/socket';

const extractTitle = file => {
  const title = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/ {2}/g, ' ');

  return title.charAt(0).toUpperCase() + title.slice(1);
};

export class UploadBox extends Component {
  constructor(props) {
    super(props);
    this.onDrop = this.onDrop.bind(this);
    socket.on('documentProcessed', sharedId => {
      this.props.documentProcessed(sharedId, 'uploads');
    });

    socket.on('conversionFailed', sharedId => {
      this.props.documentProcessError(sharedId);
    });
  }

  onDrop(files) {
    files.forEach(file => {
      const doc = { title: extractTitle(file) };
      this.props.createDocument(doc).then(newDoc => {
        this.props.uploadDocument(newDoc.sharedId, file);
      });
    });
    this.props.unselectAllDocuments();
  }

  render() {
    return (
      <Dropzone
        className="upload-box force-ltr"
        style={{}}
        onDrop={this.onDrop}
        accept="application/pdf"
      >
        <div className="upload-box_wrapper">
          <Icon icon="upload" />
          <button className="upload-box_link">Browse your PDFs to upload</button>
          <span> or drop your files here.</span>
        </div>
        <div className="protip">
          <Icon icon="lightbulb" />
          <b>ProTip!</b>
          <span>For better performance, upload your documents in batches of 50 or less.</span>
        </div>
      </Dropzone>
    );
  }
}

UploadBox.propTypes = {
  documentProcessed: PropTypes.func.isRequired,
  documentProcessError: PropTypes.func.isRequired,
  uploadDocument: PropTypes.func.isRequired,
  createDocument: PropTypes.func.isRequired,
  unselectAllDocuments: PropTypes.func.isRequired,
};

export function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      uploadDocument,
      unselectAllDocuments,
      createDocument,
      documentProcessed,
      documentProcessError,
    },
    wrapDispatch(dispatch, 'uploads')
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadBox);

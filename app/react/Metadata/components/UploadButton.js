import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {reuploadDocument} from 'app/Metadata/actions/actions';
import socket from 'app/socket';

export class UploadButton extends Component {

  constructor(props, context) {
    super(props, context);

    this.state = {processing: false, failed: false, completed: false};

    socket.on('conversionStart', (docId) => {
      if (docId === this.props.documentId) {
        this.setState({processing: true, failed: false, completed: false});
      }
    });

    socket.on('conversionFailed', (docId) => {
      if (docId === this.props.documentId) {
        this.setState({processing: false, failed: true, completed: false});
      }
    });

    socket.on('documentProcessed', (docId) => {
      if (docId === this.props.documentId) {
        this.setState({processing: false, failed: false, completed: true}, () => {
          setTimeout(() => {
            this.setState({processing: false, failed: false, completed: false});
          }, 2000);
        });
      }
    });
  }

  onChange(e) {
    let file = e.target.files[0];
    this.context.confirm({
      accept: () => {
        this.props.reuploadDocument(this.props.documentId, file, this.props.documentSharedId, this.props.storeKey);
      },
      title: 'Confirm upload',
      message: 'Are you sure you want to upload a new document?\n\n' +
               'All Table of Contents (TOC) and all text-based references linked to the previous document will be lost.'
    });
  }

  renderUploadButton() {
    return (
      <label htmlFor="upload-button-input" className="item-shortcut btn btn-default">
        <i className="fa fa-upload"></i>
        <input onChange={this.onChange.bind(this)}
               type="file"
               accept="application/pdf"
               id="upload-button-input"
               style={{display: 'none'}} />
      </label>
    );
  }

  renderCompleted() {
    return (
      <label htmlFor="upload-button-input" className="item-shortcut btn btn-success">
        <i className="fa fa-check"></i>
        <input onChange={this.onChange.bind(this)}
               type="file"
               accept="application/pdf"
               id="upload-button-input"
               style={{display: 'none'}} />
      </label>
    );
  }

  renderFailed() {
    return (
      <label htmlFor="upload-button-input" className="item-shortcut btn btn-danger">
        <i className="fa fa-exclamation-triangle"></i>
        <input onChange={this.onChange.bind(this)}
               type="file"
               accept="application/pdf"
               id="upload-button-input"
               style={{display: 'none'}} />
      </label>
    );
  }

  renderProgress(progress) {
    return <div className="item-shortcut btn btn-default btn-disabled">
             <span>{progress}%</span>
           </div>;
  }

  renderProcessing() {
    return <div className="item-shortcut btn btn-default">
             <i className="fa fa-cog fa-spin"></i>
           </div>;
  }

  render() {
    if (this.state.processing) {
      return this.renderProcessing();
    }

    if (this.state.failed) {
      return this.renderFailed();
    }

    if (this.state.completed) {
      return this.renderCompleted();
    }

    let progress = this.props.progress.get(this.props.documentId);
    if (progress) {
      return this.renderProgress(progress);
    }

    return this.renderUploadButton();
  }
}

UploadButton.propTypes = {
  reuploadDocument: PropTypes.func,
  documentId: PropTypes.string,
  documentSharedId: PropTypes.string,
  progress: PropTypes.object,
  storeKey: PropTypes.string
};

UploadButton.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = ({metadata}) => {
  return {progress: metadata.progress};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({reuploadDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadButton);

import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {reuploadDocument} from 'app/Metadata/actions/actions';
import io from 'socket.io-client';
import t from 'app/I18N/t';


export class UploadButton extends Component {

  constructor(props, context) {
    super(props, context);

    this.state = {processing: false, failed: false};
  }

  onChange(e) {
    let file = e.target.files[0];
    this.context.confirm({
      accept: () => {
        this.props.reuploadDocument(this.props.documentId, file);
      },
      title: 'Confirm upload',
      message: 'Are you sure you want to upload a new document?\nAny reference created to the previous document will be lost.'
    });
  }

  componentWillMount() {
    this.socket = io();

    this.socket.on('conversionStart', (docId) => {
      if (docId === this.props.documentId) {
        this.setState({processing: true, failed: false});
      }
    });

    this.socket.on('documentProcessed', (docId) => {
      if (docId === this.props.documentId) {
        this.setState({processing: false, failed: false});
      }
    });

    this.socket.on('conversionFailed', (docId) => {
      if (docId === this.props.documentId) {
        this.setState({processing: false, failed: true});
      }
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  renderUploadButton() {
    return <label htmlFor="upload-button-input" className="btn btn-primary">
        <i className="fa fa-cloud-upload"></i>
        <span className="btn-label">{t('System', 'Upload')}</span>
        <input onChange={this.onChange.bind(this)} type="file" id="upload-button-input" style={{display: 'none'}} />
      </label>;
  }

  renderFailed() {
    return <label htmlFor="upload-button-input" className="btn btn-danger">
        <i className="fa fa-cloud-upload"></i>
        <span className="btn-label">{t('System', 'Upload Failed')}</span>
        <input onChange={this.onChange.bind(this)} type="file" id="upload-button-input" style={{display: 'none'}} />
      </label>;
  }

  renderProgress(progress) {
    return <div className="btn btn-warning">
        <i className="fa">{progress}%</i>
        <span className="btn-label">{t('System', 'Uploading')}</span>
      </div>;
  }

  renderProcessing() {
    return <div className="btn btn-info">
        <i className="fa fa-cog"></i>
        <span className="btn-label">{t('System', 'Processing')}</span>
      </div>;
  }

  render() {
    if (this.state.processing) {
      return this.renderProcessing();
    }
    if (this.state.failed) {
      return this.renderFailed();
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
  progress: PropTypes.object
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

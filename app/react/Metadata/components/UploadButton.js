import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { uploadDocument } from 'app/Uploads/actions/uploadsActions';
import { documentProcessed } from 'app/Uploads/actions/uploadsActions';
import { wrapDispatch } from 'app/Multireducer';
import socket from 'app/socket';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import Immutable from 'immutable';

const renderProgress = progress => (
  <div className="upload-button btn btn-default btn-disabled">
    <span>{progress}%</span>
    &nbsp;
    <Translate>Uploading</Translate>
  </div>
);

const renderProcessing = () => (
  <div className="upload-button btn btn-default">
    <Icon icon="cog" spin />
    &nbsp;
    <Translate>Processing</Translate>
  </div>
);

export class UploadButton extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = { processing: false, failed: false, completed: false };
    this.conversionStart = this.conversionStart.bind(this);
    this.conversionFailed = this.conversionFailed.bind(this);
    this.documentProcessed = this.documentProcessed.bind(this);

    socket.on('conversionStart', this.conversionStart);
    socket.on('conversionFailed', this.conversionFailed);
    socket.on('documentProcessed', this.documentProcessed);

    this.onChange = this.onChange.bind(this);
  }

  componentWillUnmount() {
    socket.removeListener('conversionStart', this.conversionStart);
    socket.removeListener('conversionFailed', this.conversionFailed);
    socket.removeListener('documentProcessed', this.documentProcessed);
    clearTimeout(this.timeout);
  }

  onChange(e) {
    const file = e.target.files[0];
    this.props.uploadDocument(this.props.entitySharedId, file);
  }

  documentProcessed(docId) {
    if (docId === this.props.entitySharedId) {
      this.props.documentProcessed(docId);
      this.setState({ processing: false, failed: false, completed: true }, () => {
        this.timeout = setTimeout(() => {
          this.setState({ processing: false, failed: false, completed: false });
        }, 2000);
      });
    }
  }

  conversionStart(docId) {
    if (docId === this.props.entitySharedId) {
      this.setState({ processing: true, failed: false, completed: false });
    }
  }

  conversionFailed(docId) {
    if (docId === this.props.entitySharedId) {
      this.setState({ processing: false, failed: true, completed: false });
    }
  }

  renderButton(status = 'success', icon = 'paperclip', message = 'Upload new file') {
    return (
      <label htmlFor="upload-button-input" className={`upload-button btn btn-${status}`}>
        <Icon icon={icon} />
        <input
          onChange={this.onChange}
          type="file"
          accept="application/pdf"
          id="upload-button-input"
          style={{ display: 'none' }}
        />
        &nbsp;
        <Translate>{message}</Translate>
      </label>
    );
  }

  render() {
    if (this.state.processing) {
      return renderProcessing();
    }

    if (this.state.failed) {
      return this.renderButton('danger', 'exclamation-triangle', 'An error occured');
    }

    if (this.state.completed) {
      return this.renderButton('success', 'check', 'Success, Upload another?');
    }

    const progress = this.props.progress.get(this.props.entitySharedId);

    if (progress) {
      return renderProgress(progress);
    }

    return this.renderButton();
  }
}

UploadButton.defaultProps = {
  documentProcessed: () => {},
  progress: Immutable.fromJS({}),
  storeKey: '',
  entitySharedId: '',
  uploadDocument: () => {},
};

UploadButton.propTypes = {
  uploadDocument: PropTypes.func,
  documentProcessed: PropTypes.func,
  entitySharedId: PropTypes.string,
  progress: PropTypes.instanceOf(Immutable.Map),
  storeKey: PropTypes.string, // eslint-disable-line
};

UploadButton.contextTypes = {
  confirm: PropTypes.func,
};

const mapStateToProps = ({ metadata }) => ({ progress: metadata.progress });

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    { uploadDocument, documentProcessed },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadButton);

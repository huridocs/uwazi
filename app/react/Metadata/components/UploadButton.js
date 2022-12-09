import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import { isEmpty } from 'lodash';
import { Icon } from 'UI';
import { uploadDocument } from 'app/Uploads/actions/uploadsActions';
import { wrapDispatch } from 'app/Multireducer';
import { socket } from 'app/socket';
import { Translate } from 'app/I18N';

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

class UploadButton extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      processing: false,
      failed: false,
      completed: false,
      entitySharedId: props.entitySharedId,
    };
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

  static getDerivedStateFromProps(newProps, state) {
    if (newProps.entitySharedId !== state.entitySharedId) {
      return {
        processing: false,
        failed: false,
        completed: false,
        entitySharedId: newProps.entitySharedId,
      };
    }

    return null;
  }

  onChange(e) {
    const file = e.target.files[0];
    this.props.uploadDocument(this.props.entitySharedId, file);
  }

  documentProcessed(docId) {
    if (docId === this.props.entitySharedId) {
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

  renderButton(status = '', icon = 'plus', message = 'Add PDF') {
    return (
      <label htmlFor="upload-button-input" className={`upload-button btn upload-${status}`}>
        <Icon icon={icon} />
        &nbsp;
        <input
          onChange={this.onChange}
          type="file"
          accept="application/pdf"
          id="upload-button-input"
        />
        &nbsp;
        <Translate>{message}</Translate>
      </label>
    );
  }

  render() {
    const progress = this.props.progress.get(this.props.entitySharedId);

    switch (true) {
      case this.state.failed:
        return this.renderButton('failed', 'exclamation-triangle', 'An error occurred');
      case this.state.processing || progress === 0:
        return renderProcessing();
      case progress > 0 && progress < 100:
        return renderProgress(progress);
      case this.state.completed || progress === 100:
        return this.renderButton('success', 'check', 'Success, Upload another?');

      default:
        return this.renderButton();
    }
  }
}

UploadButton.defaultProps = {
  progress: Immutable.fromJS({}),
  storeKey: '',
  entitySharedId: '',
  uploadDocument: () => {},
};

UploadButton.propTypes = {
  uploadDocument: PropTypes.func,
  entitySharedId: PropTypes.string,
  progress: PropTypes.instanceOf(Immutable.Map),
  storeKey: PropTypes.string, // eslint-disable-line
};

const mapStateToProps = ({ metadata, progress }) => ({
  progress: isEmpty(progress) ? metadata.progress : progress,
});

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ uploadDocument }, wrapDispatch(dispatch, props.storeKey));
}

export { UploadButton };
export default connect(mapStateToProps, mapDispatchToProps)(UploadButton);

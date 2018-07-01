import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { Thumbnail, ConfirmButton } from 'app/Layout';
import { actions } from 'app/BasicReducer';
import { t } from 'app/I18N';
import RouteHandler from 'app/App/RouteHandler';
import api from 'app/utils/api';

import { uploadCustom, deleteCustomUpload } from '../../Uploads/actions/uploadsActions';

export class CustomUploads extends RouteHandler {
  static requestState() {
    return api.get('customisation/upload')
    .then(customUploads => ({ customUploads: customUploads.json }));
  }

  constructor(props, context) {
    super(props, context);
    this.onDrop = this.onDrop.bind(this);
  }

  onDrop(files) {
    files.forEach((file) => {
      this.props.upload(file);
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('customUploads', state.customUploads));
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Custom Uploads')}</div>
        <div className="panel-body custom-uploads">
          <Dropzone
            className="upload-box"
            onDrop={this.onDrop}
          >
            <div className="upload-box_wrapper">
              <i className="fa fa-upload" />
              <button className="upload-box_link">Browse files to upload</button>
              <span> or drop your files here.</span>
            </div>
            <div className="protip">
              <i className="fa fa-lightbulb-o" />
            </div>
          </Dropzone>
          {this.props.progress && <p className="uploading"><i className="fas fa-spinner fa-spin" />&nbsp;Uploading ...</p>}
          <ul>
            {this.props.customUploads.map(upload => (
              <li key={upload.get('filename')}>
                <Thumbnail file={`/uploaded_documents/${upload.get('filename')}`} />
                <div className="info">
                  URL:<br />
                  <span className="thumbnail-url">{`/uploaded_documents/${upload.get('filename')}`}</span>
                  <ConfirmButton action={() => this.props.deleteCustomUpload(upload.get('_id'))}>Delete</ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

CustomUploads.defaultProps = {
  progress: false
};

CustomUploads.contextTypes = {
  confirm: PropTypes.func,
  store: PropTypes.object
};

CustomUploads.propTypes = {
  progress: PropTypes.bool,
  customUploads: PropTypes.instanceOf(Immutable.List).isRequired,
  upload: PropTypes.func.isRequired,
  deleteCustomUpload: PropTypes.func.isRequired
};

export const mapStateToProps = ({ customUploads, progress }) => ({
  customUploads,
  progress: !!progress.filter((v, key) => key.match(/customUpload/)).size
});

const mapDispatchToProps = dispatch => bindActionCreators({ upload: uploadCustom, deleteCustomUpload }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CustomUploads);

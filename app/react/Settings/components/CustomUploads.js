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
import { Icon } from 'UI';

import { uploadCustom, deleteCustomUpload } from '../../Uploads/actions/uploadsActions';

export class CustomUploads extends RouteHandler {
  static async requestState(requestParams) {
    const customUploads = await api.get('customisation/upload', requestParams);
    return [actions.set('customUploads', customUploads.json)];
  }

  constructor(props, context) {
    super(props, context);
    this.onDrop = this.onDrop.bind(this);
  }

  onDrop(files) {
    files.forEach(file => {
      this.props.upload(file);
    });
  }

  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Custom Uploads')}</div>
        <div className="panel-body custom-uploads">
          <Dropzone className="upload-box" onDrop={this.onDrop}>
            <div className="upload-box_wrapper">
              <Icon icon="upload" />
              <button className="upload-box_link" type="button">
                Browse files to upload
              </button>
              <span> or drop your files here.</span>
            </div>
            {this.props.progress && (
              <div className="uploading">
                <Icon icon="spinner" spin /> Uploading ...
              </div>
            )}
          </Dropzone>
          <ul>
            {this.props.customUploads.map(upload => (
              <li key={upload.get('filename')}>
                <Thumbnail file={`/assets/${upload.get('filename')}`} />
                <div className="info">
                  URL:
                  <br />
                  <span className="thumbnail-url">{`/assets/${upload.get('filename')}`}</span>
                  <ConfirmButton action={() => this.props.deleteCustomUpload(upload.get('_id'))}>
                    Delete
                  </ConfirmButton>
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
  progress: false,
};

CustomUploads.propTypes = {
  progress: PropTypes.bool,
  customUploads: PropTypes.instanceOf(Immutable.List).isRequired,
  upload: PropTypes.func.isRequired,
  deleteCustomUpload: PropTypes.func.isRequired,
};

export const mapStateToProps = ({ customUploads, progress }) => ({
  customUploads,
  progress: !!progress.filter((_v, key) => key.match(/customUpload/)).size,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators({ upload: uploadCustom, deleteCustomUpload }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CustomUploads);

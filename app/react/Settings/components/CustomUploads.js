import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { Thumbnail, ConfirmButton } from 'app/Layout';
import { actions } from 'app/BasicReducer';
import { Translate } from 'app/I18N';
import RouteHandler from 'app/App/RouteHandler';
import api from 'app/utils/api';
import { Icon } from 'UI';

import { uploadCustom, deleteCustomUpload } from '../../Uploads/actions/uploadsActions';

class CustomUploads extends RouteHandler {
  static async requestState(requestParams) {
    const customUploads = await api.get('files', requestParams.add({ type: 'custom' }));
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
      <div className="settings-content without-footer">
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Custom Uploads</Translate>
          </div>
          <div className="panel-body custom-uploads">
            <Dropzone className="upload-box" onDrop={this.onDrop}>
              <div className="upload-box_wrapper">
                <Icon icon="upload" />
                <button className="upload-box_link" type="button">
                  <Translate>Browse files to upload</Translate>
                </button>
                <span>
                  &nbsp;<Translate>or drop your files here.</Translate>
                </span>
              </div>
              {this.props.progress && (
                <div className="uploading">
                  <Icon icon="spinner" spin />
                  <Translate>Uploading ...</Translate>
                </div>
              )}
            </Dropzone>
            <ul>
              {this.props.customUploads.map(upload => (
                <li key={upload.get('filename')}>
                  <Thumbnail file={`/assets/${upload.get('filename')}`} />
                  <div className="info">
                    <span no-translate>URL:</span>
                    <span className="thumbnail-url">{`/assets/${upload.get('filename')}`}</span>
                    <ConfirmButton action={() => this.props.deleteCustomUpload(upload.get('_id'))}>
                      <Translate>Delete</Translate>
                    </ConfirmButton>
                  </div>
                </li>
              ))}
            </ul>
          </div>
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

export { CustomUploads };

export default connect(mapStateToProps, mapDispatchToProps)(CustomUploads);

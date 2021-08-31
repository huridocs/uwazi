import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';

import { Translate } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import { Icon } from 'UI';
import { LocalForm, Control } from 'react-redux-form';
import { closeImportPanel, importData } from 'app/Uploads/actions/uploadsActions';
import ImportProgress from './ImportProgress';
import socket from '../../socket';

export class ImportPanel extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.close = this.close.bind(this);
    this.state = { showError: false };
    this.showError = this.showError.bind(this);
    this.importError = '';
  }

  close() {
    this.props.closeImportPanel();
  }

  handleSubmit(values) {
    this.props.importData(values.file, values.template);
  }

  componentDidMount() {
    socket.on('IMPORT_CSV_ERROR', this.showError);
  }

  showError(e) {
    this.importError = e.error;
    this.setState({ showError: true });
  }

  renderForm() {
    const { templates } = this.props;
    const template = templates.find(templ => templ.get('default')).get('_id');
    return (
      <div>
        <div className="alert alert-info">
          <Icon icon="info-circle" size="2x" />
          <div className="force-ltr">
            <Translate>Upload a ZIP or CSV file.</Translate>&nbsp;
            <a
              rel="noopener noreferrer"
              href="https://github.com/huridocs/uwazi/wiki/Import-CSV"
              target="_blank"
            >
              <Translate>Import instructions</Translate>
            </a>
          </div>
        </div>
        <LocalForm onSubmit={this.handleSubmit} id="import" initialState={{ template }}>
          <div className="form-group">
            <ul className="search__filter">
              <li>
                <label htmlFor="file">
                  <Translate>File</Translate>
                </label>
              </li>
              <li className="wide">
                <Control.file id="file" model=".file" accept=".zip,.csv" />
              </li>
            </ul>
          </div>
          <div className="form-group">
            <ul className="search__filter">
              <li>
                <label htmlFor="template">
                  <Translate>Template</Translate>
                </label>
              </li>
              <li className="wide">
                <Control.select id="template" model=".template">
                  {templates.map(t => (
                    <option key={t.get('_id')} value={t.get('_id')}>
                      {t.get('name')}
                    </option>
                  ))}
                </Control.select>
              </li>
            </ul>
          </div>
          <div className="form-group" />
        </LocalForm>
        <div className="sidepanel-footer">
          <button form="import" type="submit" className="btn btn-primary">
            <Icon icon="upload" />
            <span className="btn-label">
              <Translate>Import</Translate>
            </span>
          </button>
        </div>
      </div>
    );
  }

  renderUploadProgress() {
    const { uploadProgress } = this.props;
    return (
      <div className="alert alert-info">
        <Icon icon="info-circle" size="2x" />
        <div className="force-ltr">Uploading file {uploadProgress}%</div>
      </div>
    );
  }

  renderContents() {
    const { uploadProgress, importStart, importProgress } = this.props;
    if (uploadProgress) {
      return this.renderUploadProgress();
    }
    if (this.state.showError) {
      return (
        <div className="alert alert-danger">
          <Icon icon="exclamation-triangle" />
          <div className="error">{this.importError}</div>
        </div>
      );
    }

    if (importStart || importProgress) {
      return <ImportProgress />;
    }
    return this.renderForm();
  }

  render() {
    const { open } = this.props;
    return (
      <SidePanel open={open} className="metadata-sidepanel">
        <div className="sidepanel-header">
          <button type="button" className="closeSidepanel close-modal" onClick={this.close}>
            <Icon icon="times" />
          </button>
        </div>
        {this.renderContents()}
      </SidePanel>
    );
  }
}

ImportPanel.defaultProps = {
  open: false,
  uploadProgress: 0,
  importStart: false,
  importProgress: 0,
};

ImportPanel.propTypes = {
  open: PropTypes.bool,
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  closeImportPanel: PropTypes.func.isRequired,
  importData: PropTypes.func.isRequired,
  uploadProgress: PropTypes.number,
  importProgress: PropTypes.number,
  importStart: PropTypes.bool,
};

export const mapStateToProps = state => ({
  open: state.importEntities.showImportPanel,
  templates: state.templates,
  uploadProgress: state.importEntities.importUploadProgress,
  importStart: state.importEntities.importStart,
  importProgress: state.importEntities.importProgress,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ closeImportPanel, importData }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportPanel);

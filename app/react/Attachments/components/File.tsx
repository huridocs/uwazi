import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Translate, t } from 'app/I18N';
import { language as transformLanguage, availableLanguages } from 'shared/languagesList';
import { isBlobFile } from 'shared/tsUtils';
import { Icon } from 'UI';
import { FileType } from 'shared/types/fileType';
import { APIURL } from 'app/config.js';
import { LocalForm, Control } from 'react-redux-form';
import { ClientBlobFile } from 'app/istore';
import { updateFile, deleteFile } from 'app/Attachments/actions/actions';
import { wrapDispatch } from 'app/Multireducer';
import { TocGeneratedLabel } from 'app/ToggledFeatures/tocGeneration';
import { NeedAuthorization } from 'app/Auth';
import { EntitySchema } from 'shared/types/entityType';
import { ViewDocumentLink } from './ViewDocumentLink';

type FileProps = {
  file: FileType | ClientBlobFile;
  storeKey: string;
  entity: EntitySchema;
  updateFile: (file: FileType, entity: Object) => any | void;
  deleteFile: (file: FileType, entity: Object) => any | void;
};
type FileState = {
  editing: boolean;
};

class File extends Component<FileProps, FileState> {
  static defaultProps = { updateFile: () => {}, deleteFile: () => {} };

  static contextTypes = {
    confirm: PropTypes.func,
  };

  constructor(props: FileProps) {
    super(props);
    this.state = {
      editing: false,
    };
    this.edit = this.edit.bind(this);
    this.cancel = this.cancel.bind(this);
    this.delete = this.delete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  edit() {
    this.setState({ editing: true });
  }

  cancel() {
    this.setState({ editing: false });
  }

  delete() {
    this.context.confirm({
      accept: () => {
        this.props.deleteFile(this.props.file, this.props.entity);
        this.setState({ editing: false });
      },
      title: 'Confirm delete file',
      message: 'Are you sure you want to delete this file?',
    });
  }

  handleSubmit(file: FileType) {
    this.props.updateFile(file, this.props.entity);
    this.setState({ editing: false });
  }

  renderDeleteButton() {
    return (
      <button type="button" className="btn btn-outline-danger" value="Delete" onClick={this.delete}>
        <Icon icon="trash-alt" />
        &nbsp;
        <Translate>Delete</Translate>
      </button>
    );
  }

  renderFailed() {
    return (
      <div className="file-failed">
        <Icon icon="times" />
        &nbsp;
        <Translate>Conversion failed</Translate>
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[this.props.entity]}>
          {this.renderDeleteButton()}
        </NeedAuthorization>
      </div>
    );
  }

  renderReady() {
    const { language, filename = '' } = this.props.file;
    return (
      <div>
        <div>
          <span className="badge">
            <Translate>{language ? transformLanguage(language) || '' : ''}</Translate>
          </span>
          <TocGeneratedLabel file={this.props.file}>
            <Translate>ML TOC</Translate>
          </TocGeneratedLabel>
        </div>
        <div>
          <a
            href={`${APIURL}files/${filename}`}
            target="_blank"
            rel="noopener noreferrer"
            className="file-download btn btn-outline-secondary"
          >
            <Icon icon="cloud-download-alt" />
            &nbsp;
            <Translate>Download</Translate>
          </a>
          <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[this.props.entity]}>
            <button type="button" className="file-edit btn btn-outline-success" onClick={this.edit}>
              <Icon icon="pencil-alt" />
              &nbsp;
              <Translate>Edit</Translate>
            </button>
          </NeedAuthorization>
          <ViewDocumentLink filename={filename} entity={this.props.entity}>
            <Translate>View</Translate>
          </ViewDocumentLink>
        </div>
      </div>
    );
  }

  renderView() {
    const { originalname, status } = !isBlobFile(this.props.file)
      ? this.props.file
      : { originalname: (this.props.file as ClientBlobFile).originalFile.name, status: 'ready' };
    return (
      <div className="file">
        <div className="file-originalname">{originalname}</div>
        {status === 'ready' && this.renderReady()}
        {status === 'failed' && this.renderFailed()}
        {status === 'processing' && (
          <div>
            <Icon icon="clock" />
            &nbsp;
            <Translate>Processing</Translate>
          </div>
        )}
      </div>
    );
  }

  renderEditing() {
    const mapProps = {
      className: ({ fieldValue }: any) =>
        fieldValue.submitFailed && !fieldValue.valid ? 'form-control has-error' : 'form-control',
    };
    return (
      <LocalForm onSubmit={this.handleSubmit} initialState={this.props.file} className="file-form">
        <div className="form-group row">
          <div className="col-sm-12">
            <label htmlFor="originalname">
              <Translate>Document Title</Translate>&nbsp;*
            </label>
            <Control.text
              validators={{ required: (val: string) => Boolean(val && val.length) }}
              className="form-control"
              model=".originalname"
              id="originalname"
              mapProps={mapProps}
            />
          </div>
          <div className="col-sm-3">
            <label htmlFor="language">
              <Translate>Language</Translate>
            </label>
          </div>
          <div className="col-sm-9">
            <Control.select className="form-control" model=".language" id="language">
              {availableLanguages.map(language => (
                <option key={language.ISO639_3} value={language.ISO639_3}>
                  {language.localized_label} ({language.label})
                </option>
              ))}
              <option value="other">{t('System', 'other', 'other', false)}</option>
            </Control.select>
          </div>
          <div className="col-sm-4">
            <button type="submit" className="btn btn-outline-success">
              <Icon icon="save" />
              &nbsp;
              <Translate>Save</Translate>
            </button>
          </div>
          <div className="col-sm-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              value="Cancel"
              onClick={this.cancel}
            >
              <Icon icon="times" />
              &nbsp;
              <Translate>Cancel</Translate>
            </button>
          </div>
          <div className="col-sm-4">{this.renderDeleteButton()}</div>
        </div>
      </LocalForm>
    );
  }

  render() {
    return this.state.editing ? this.renderEditing() : this.renderView();
  }
}

const mapDispatchToProps = (dispatch: Dispatch<{}>, props: FileProps) =>
  bindActionCreators({ updateFile, deleteFile }, wrapDispatch(dispatch, props.storeKey));

export type { FileProps };
export { File };
export const ConnectedFile = connect(null, mapDispatchToProps)(File);

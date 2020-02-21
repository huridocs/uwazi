import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Translate } from 'app/I18N';
import transformLanguage, { languages } from 'shared/languagesList.ts';
import { Icon } from 'UI';
import { FileType } from 'shared/types/fileType';
import { APIURL } from 'app/config.js';
import { LocalForm, Control } from 'react-redux-form';
import { updateFile, deleteFile } from 'app/Attachments/actions/actions';
import { wrapDispatch } from 'app/Multireducer';

export type FileProps = {
  file: FileType;
  storeKey: string;
  readOnly: boolean;
  updateFile: (file: FileType, storeKey: string) => any | void;
  deleteFile: (file: FileType, storeKey: string) => any | void;
};

type FileState = {
  editing: boolean;
};

export class File extends Component<FileProps, FileState> {
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
        this.props.deleteFile(this.props.file, this.props.storeKey);
        this.setState({ editing: false });
      },
      title: 'Confirm delete file',
      message: 'Are you sure you want to delete this file?',
    });
  }

  handleSubmit(file: FileType) {
    this.props.updateFile(file, this.props.storeKey);
    this.setState({ editing: false });
  }

  renderView() {
    const { originalname, language, filename } = this.props.file;

    return (
      <div className="file">
        <div className="file-originalname">{originalname}</div>
        <div>
          <div className="file-language">{language ? transformLanguage(language) : ''}</div>
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
          <button type="button" className="file-edit btn btn-outline-success" onClick={this.edit}>
            <Icon icon="pencil-alt" />
            &nbsp;
            <Translate>Edit</Translate>
          </button>
        </div>
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
              validators={{ required: (val: string) => val && val.length }}
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
              {Object.keys(languages).map(language => (
                <option key={language} value={language}>
                  {transformLanguage(language)}
                </option>
              ))}
              <option value="other">
                <Translate>other</Translate>
              </option>
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
          <div className="col-sm-4">
            <button
              type="button"
              className="btn btn-outline-danger"
              value="Delete"
              onClick={this.delete}
            >
              <Icon icon="trash-alt" />
              &nbsp;
              <Translate>Delete</Translate>
            </button>
          </div>
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

export const ConnectedFile = connect(null, mapDispatchToProps)(File);

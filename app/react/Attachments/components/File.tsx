import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import transformLanguage, { languages } from 'shared/languagesList.ts';
import { Icon } from 'UI';
import { FileType } from 'shared/types/fileType';
import { APIURL } from 'app/config.js';
import { LocalForm, Control } from 'react-redux-form';

const defaultProps = {
  file: null,
  entitySharedId: null,
  readOnly: false,
};

export type FileProps = {
  file: FileType;
  entitySharedId: string;
  readonly: boolean;
};

type FileState = {
  editing: boolean;
  file: FileType;
};

export class File extends Component<FileProps, FileState> {
  static defaultProps = defaultProps;

  constructor(props: FileProps) {
    super(props);
    this.state = {
      editing: false,
      file: props.file,
    };
    this.edit = this.edit.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  componentWillReceiveProps(props: FileProps) {
    const { file } = props;
    this.setState({ file });
  }

  edit() {
    this.setState({ editing: true });
  }

  cancel() {
    this.setState({ editing: false });
  }

  handleSubmit(file: FileType) {}

  renderView() {
    const { originalname, language, filename } = this.state.file;
    return (
      <div className="file">
        <div className="file-originalname">{originalname}</div>
        <div>
          <div className="file-language">{language ? transformLanguage(language) : ''}</div>
          <a
            href={`${APIURL}files/${filename}`}
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
    return (
      <LocalForm onSubmit={this.handleSubmit} initialState={this.state.file}>
        <div className="form-group col-sm-12">
          <label htmlFor="originalname">Document Title*</label>
          <Control.text className="form-control" model=".originalname" id="originalname" />
        </div>
        <div className="form-group col-sm-12">
          <label htmlFor="language">Language</label>
          <Control.select className="form-control" model=".language" id="language">
            {Object.keys(languages).map(language => (
              <option key={language} value={language}>
                {transformLanguage(language)}
              </option>
            ))}
            <option value="other">other</option>
          </Control.select>
        </div>
        <div className="form-group col-sm-4">
          <input type="submit" className="btn btn-outline-success" value="Save" />
        </div>
        <div className="form-group col-sm-4">
          <input
            type="button"
            className="btn btn-outline-secondary"
            value="Cancel"
            onClick={this.cancel}
          />
        </div>
        <div className="form-group col-sm-4">
          <input type="button" className="btn btn-outline-danger" value="Delete" />
        </div>
      </LocalForm>
    );
  }

  render() {
    return this.state.editing ? this.renderEditing() : this.renderView();
  }
}

import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import languages from 'shared/languagesList.ts';
import { Icon } from 'UI';
import { FileType } from 'shared/types/fileType';

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
  }

  componentWillReceiveProps(props: FileProps) {
    const { file } = props;
    this.setState({ file });
  }

  edit() {
    this.setState({ editing: true });
  }

  renderView() {
    const { originalname, language } = this.state.file;
    return (
      <div className="file">
        <div className="file-originalname">{originalname}</div>
        <div>
          <div className="file-language">{languages(language)}</div>
          <button type="button" className="file-download btn btn-outline-secondary">
            <Icon icon="cloud-download-alt" />
            &nbsp;
            <Translate>Download</Translate>
          </button>
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
    return <div />;
  }

  render() {
    return this.state.editing ? this.renderEditing() : this.renderView();
  }
}

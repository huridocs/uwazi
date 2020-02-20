import React, { Component } from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { ConnectedFile as File } from './File';
import { FileType } from 'shared/types/fileType';
import UploadButton from 'app/Metadata/components/UploadButton';

const defaultProps = {
  files: [],
  entitySharedId: null,
  readOnly: false,
  storeKey: '',
};

type FileListProps = {
  files: Array<FileType>;
  entitySharedId: string;
  readOnly: boolean;
  storeKey: string;
};

export class FileList extends Component<FileListProps> {
  static arrangeFiles(files: Array<FileType> = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  static defaultProps = defaultProps;

  renderFile(file: FileType) {
    return (
      <li key={file._id}>
        <File file={file} storeKey={this.props.storeKey} readOnly={this.props.readOnly} />
      </li>
    );
  }

  render() {
    const { files } = this.props;
    return (
      <div className="filelist">
        <h2>
          <Translate>Documents</Translate>
        </h2>
        <ul>{files.map(file => this.renderFile(file))}</ul>
        <UploadButton entitySharedId={this.props.entitySharedId} />
      </div>
    );
  }
}

export default FileList;

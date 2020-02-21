import React, { Component } from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import UploadButton from 'app/Metadata/components/UploadButton';
import { ConnectedFile as File } from './File';

const defaultProps = {
  files: [],
  entitySharedId: null,
  readOnly: false,
  storeKey: '',
};

export type FileListProps = {
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
    const { readOnly, storeKey } = this.props;
    return (
      <li key={file._id}>
        <File file={file} storeKey={storeKey} readOnly={readOnly} />
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

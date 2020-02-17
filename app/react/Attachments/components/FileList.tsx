import React, { Component } from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { File } from './File';
import { FileSchema } from 'shared/types/fileType';

const defaultProps = {
  files: [],
  entitySharedId: null,
  readOnly: false,
};

type FileListProps = {
  files: Array<FileSchema>;
  entitySharedId: String;
  readOnly: Boolean;
};

export class FileList extends Component<FileListProps> {
  static arrangeFiles(files: Array<FileSchema> = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  static defaultProps = defaultProps;

  static renderFile(file: FileSchema) {
    return (
      <li key={Math.random()}>
        <File file={file} />
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
        <ul>{files.map(FileList.renderFile)}</ul>
      </div>
    );
  }
}

export default FileList;

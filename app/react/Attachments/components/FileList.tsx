import React, { Component } from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { EntitySchema } from 'shared/types/entityType';
import UploadButton from 'app/Metadata/components/UploadButton';
import { ConnectedFile as File } from './File';
import { NeedAuthorization } from 'app/Auth';

const defaultProps = {
  files: [],
  entity: null,
  readOnly: false,
  storeKey: '',
};

export type FileListProps = {
  files: Array<FileType>;
  entity: EntitySchema;
  readOnly: boolean;
  storeKey: string;
};

export class FileList extends Component<FileListProps> {
  static arrangeFiles(files: Array<FileType> = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  static defaultProps = defaultProps;

  renderFile(file: FileType, index: number) {
    const { readOnly, storeKey, entity } = this.props;
    return (
      <li key={index}>
        <File file={file} storeKey={storeKey} readOnly={readOnly} entity={entity} />
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
        <ul>{files.map((file, index) => this.renderFile(file, index))}</ul>
        <NeedAuthorization roles={['admin', 'editor']}>
          <UploadButton
            entitySharedId={this.props.entity.sharedId}
            storeKey={this.props.storeKey}
          />
        </NeedAuthorization>
      </div>
    );
  }
}

export default FileList;

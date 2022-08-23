/* eslint-disable prefer-destructuring */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/sort-comp */
import React, { Component } from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { EntitySchema } from 'shared/types/entityType';
import UploadButton from 'app/Metadata/components/UploadButton';
import { NeedAuthorization } from 'app/Auth';
import languageLib from 'shared/languages';
import { ConnectedFile as File } from './File';
import './scss/filelist.scss';

const defaultProps = {
  files: [],
  entity: null,
  storeKey: '',
};

export type FileListProps = {
  files: Array<FileType>;
  entity: EntitySchema;
  storeKey: string;
};

export class FileList extends Component<FileListProps> {
  static arrangeFiles(files: Array<FileType> = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  static defaultProps = defaultProps;

  renderFile(file: FileType, index: number) {
    const { storeKey, entity } = this.props;
    return (
      <li key={index}>
        <File file={file} storeKey={storeKey} entity={entity} />
      </li>
    );
  }

  orderFilesByLanguage(files: FileType[], systemLanguage: string) {
    const orderedFiles = [...files];
    const fileIndex = orderedFiles.findIndex(file => {
      const language = languageLib.get(file.language as string, 'ISO639_1');
      return language === systemLanguage;
    });
    if (fileIndex > -1) {
      const temp = orderedFiles[fileIndex];
      orderedFiles[fileIndex] = orderedFiles[0];
      orderedFiles[0] = temp;
    }
    return orderedFiles;
  }

  render() {
    const label = (
      <h2>
        <Translate>Primary Documents</Translate>
      </h2>
    );

    const { files, entity } = this.props;
    const orderedFiles = this.orderFilesByLanguage(files, entity.language as string);
    return (
      <div className="filelist">
        <div className="filelist-header">
          {orderedFiles.length === 0 ? (
            <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
              {label}
            </NeedAuthorization>
          ) : (
            <>{label}</>
          )}
          <div>
            <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
              <UploadButton
                entitySharedId={this.props.entity.sharedId}
                storeKey={this.props.storeKey}
              />
            </NeedAuthorization>
          </div>
        </div>
        <ul>{orderedFiles.map((file, index) => this.renderFile(file, index))}</ul>
      </div>
    );
  }
}

export default FileList;

import React, { Component } from 'react';
import { withContext } from '../../componentWrappers.js';
import { advancedSort } from '../../utils/advancedSort.js';
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
import UploadButton from '../../Metadata/components/UploadButton.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
import { LanguageUtils } from 'shared/language/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../Auth.js' or its correspo... Remove this comment to see the full error message
import { NeedAuthorization } from '../../Auth.js';
import { ConnectedFile as File } from './File';
import './scss/filelist.scss';

const defaultProps = {
  files: [],
  storeKey: '',
  entity: {},
  readonly: false,
};

export type FileListProps = {
  files: Array<FileType>;
  storeKey: string;
  mainContext: { confirm: Function };
  entity?: EntitySchema;
  readonly?: boolean;
};

const orderFilesByLanguage = (files: FileType[], systemLanguage: string) => {
  const orderedFiles = [...files];
  const fileIndex = orderedFiles.findIndex(file => {
    const language = LanguageUtils.fromISO639_3(file.language as string)?.ISO639_1;
    return language === systemLanguage;
  });
  if (fileIndex > -1) {
    const temp = orderedFiles[fileIndex];
    [orderedFiles[fileIndex]] = orderedFiles;
    orderedFiles[0] = temp;
  }
  return orderedFiles;
};

export class FileList extends Component<FileListProps> {
  static arrangeFiles(files: Array<FileType> = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  static defaultProps = defaultProps;

  renderFile(file: FileType, index: number) {
    const { entity = {} } = this.props;
    return (
      <li key={index}>
        <File
          file={file}
          entity={entity}
          readonly={this.props.readonly}
          mainContext={this.props.mainContext}
        />
      </li>
    );
  }

  render() {
    const label = (
      <h2>
        <Translate>Primary Documents</Translate>
      </h2>
    );

    const { files, storeKey, readonly, entity = {} } = this.props;
    const orderedFiles = orderFilesByLanguage(files, entity.language as string);
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
          {!readonly && (
            <div>
              <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
                <UploadButton entitySharedId={entity.sharedId} storeKey={storeKey} />
              </NeedAuthorization>
            </div>
          )}
        </div>
        <ul>{orderedFiles.map((file, index) => this.renderFile(file, index))}</ul>
      </div>
    );
  }
}

export default withContext(FileList);

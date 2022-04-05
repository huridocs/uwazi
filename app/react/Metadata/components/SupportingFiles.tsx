import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions, Field } from 'react-redux-form';

import uniqueID from 'shared/uniqueID';
import { ClientFile } from 'app/istore';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { getFileExtension } from 'app/utils/getFileExtension';
import UploadSupportingFile from 'app/Attachments/components/UploadSupportingFile';
import {
  uploadLocalAttachment,
  uploadLocalAttachmentFromUrl,
} from '../actions/supportingFilesActions';

type SupportingFilesProps = {
  model: string;
  supportingFiles: ClientFile[];
  entitySharedID: string;
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: SupportingFilesProps) => {
  const { model } = ownProps;
  return bindActionCreators(
    {
      removeSupportingFile: (index: number) => actions.remove(`${model}.attachments`, index),
    },
    dispatch
  );
};

const connector = connect(null, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = SupportingFilesProps & mappedProps;

const getFileIcon = (file: ClientFile & { serializedFile?: string }) => {
  const acceptedThumbnailExtensions = ['png', 'gif', 'jpg', 'jpeg'];
  let thumbnail = (
    <span no-translate>
      <Icon icon="file" /> file
    </span>
  );

  if (file.filename && getFileExtension(file.filename) === 'pdf') {
    thumbnail = (
      <span no-translate>
        <Icon icon="file-pdf" /> pdf
      </span>
    );
  }

  if (file.url) {
    thumbnail = (
      <span>
        <Icon icon="link" />
      </span>
    );
  }

  if (
    !file.serializedFile &&
    file.filename &&
    acceptedThumbnailExtensions.indexOf(getFileExtension(file.filename.toLowerCase())) !== -1
  ) {
    thumbnail = <img src={`/api/files/${file.filename}`} alt={file.originalname} />;
  }
  return thumbnail;
};

const SupportingFiles = ({
  supportingFiles,
  entitySharedID,
  model,
  removeSupportingFile,
}: ComponentProps) => (
  <div className="attachments-list-parent">
    <div className="attachments-list-header editor">
      <h2>
        <Translate>Supporting files</Translate>
      </h2>

      <UploadSupportingFile
        entitySharedId={entitySharedID || 'NEW_ENTITY'}
        storeKey="library"
        uploadAttachment={uploadLocalAttachment}
        uploadAttachmentFromUrl={uploadLocalAttachmentFromUrl}
        model={model}
      />
    </div>

    <div className="attachments-list editor">
      {supportingFiles.map((file: ClientFile, index: number) => {
        const attachmentClass = file._id ? 'attachment' : 'attachment new';
        return (
          <div className={attachmentClass} key={file._id || uniqueID()}>
            <div className="attachment-thumbnail">{getFileIcon(file)}</div>
            <div className="attachment-name">
              <Field model={`.attachments.${index}.originalname`} updateOn="blur">
                <input className="form-control" />
              </Field>
            </div>
            <button
              type="button"
              className="btn delete-supporting-file"
              onClick={() => removeSupportingFile(index)}
            >
              <Icon icon="trash-alt" />
              &nbsp; <Translate>Delete file</Translate>
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

const container = connector(SupportingFiles);
export { container as SupportingFiles };

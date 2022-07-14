import React from 'react';
import { Field } from 'react-redux-form';
import { ClientFile } from 'app/istore';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { getFileExtension } from 'app/utils/getFileExtension';
import uniqueID from 'shared/uniqueID';

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

const fieldModel = (file: ClientFile, type: string, index: number) => {
  if (type === 'attachment') return `.attachments.${index}.originalname`;
  if (file._id) return `.documents.${index}.originalname`;
  return `.documents.${index}.originalFile.name`;
};

type EntityFilesProps = {
  files: ClientFile[];
  removeFile: (index: number) => void;
  type: 'attachment' | 'document';
};

const MetadataFormFiles = ({ files = [], removeFile, type }: EntityFilesProps) => (
  <div className="attachments-list editor">
    {files.map((file: ClientFile, index: number) => {
      const attachmentClass = file._id ? 'attachment' : 'attachment new';
      return (
        <div className={attachmentClass} key={file._id || uniqueID()}>
          <div className="attachment-thumbnail">{getFileIcon(file)}</div>
          <div className="attachment-name">
            <Field model={fieldModel(file, type, index)} updateOn="blur">
              <input className="form-control" />
            </Field>
          </div>
          <button
            type="button"
            className="btn delete-supporting-file"
            onClick={() => removeFile(index)}
          >
            <Icon icon="trash-alt" />
            &nbsp; <Translate>Delete file</Translate>
          </button>
        </div>
      );
    })}
  </div>
);

export { MetadataFormFiles };

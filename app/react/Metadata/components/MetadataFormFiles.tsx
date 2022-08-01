import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { Field, actions } from 'react-redux-form';
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
  type: 'attachment' | 'document';
  model: string;
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: EntityFilesProps) => {
  const { model, type } = ownProps;
  const path = type === 'attachment' ? `${model}.attachments` : `${model}.documents`;
  return bindActionCreators(
    {
      removeFile: (index: number) => actions.remove(path, index),
    },
    dispatch
  );
};

const connector = connect(null, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = EntityFilesProps & mappedProps;

const MetadataFormFiles = ({ files = [], removeFile, type }: ComponentProps) => (
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

const container = connector(MetadataFormFiles);
export { container as MetadataFormFiles };

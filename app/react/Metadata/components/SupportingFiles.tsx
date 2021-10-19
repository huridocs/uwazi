import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions, Field } from 'react-redux-form';

import { ClientFile, IStore } from 'app/istore';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { getFileExtension } from 'app/utils/getFileExtension';
import UploadSupportingFile from 'app/Attachments/components/UploadSupportingFile';

type SupportingFilesProps = {
  model: string;
  storeKey?: string;
};

const mapStateToProps = (store: IStore, ownProps: SupportingFilesProps) => {
  const { storeKey } = ownProps;
  const entity =
    storeKey === 'library' ? store.library.sidepanel.metadata : store.entityView.entityForm;

  return {
    entity,
  };
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

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = SupportingFilesProps & mappedProps;

const getFileIcon = (file: ClientFile) => {
  const acceptedThumbnailExtensions = ['png', 'gif', 'jpg', 'jpeg'];
  let thumbnail = null;

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
    file.filename &&
    acceptedThumbnailExtensions.indexOf(getFileExtension(file.filename.toLowerCase())) !== -1
  ) {
    thumbnail = <img src={`/api/files/${file.filename}`} alt={file.originalname} />;
  }
  return thumbnail;
};

const SupportingFiles = ({ entity, storeKey, removeSupportingFile }: ComponentProps) => {
  const { attachments = [] } = entity;

  return (
    <div>
      <h2>
        <Translate>Supporting files</Translate>
      </h2>

      <div>
        <UploadSupportingFile entitySharedId={entity.sharedId} storeKey="library" />
      </div>

      <div className="attachments-list">
        {attachments.map((file: ClientFile, index: number) => (
          <div className="attachment" key={file._id}>
            <div className="attachment-thumbnail">{getFileIcon(file)}</div>
            <div className="attachment-name">
              <Field model={`.attachments.${index}.originalname`}>
                <input className="form-control" />
              </Field>
            </div>
            <button
              type="button"
              className="btn btn-danger delete-supporting-file"
              onClick={() => removeSupportingFile(index)}
            >
              <Icon icon="trash-alt" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const container = connector(SupportingFiles);
export { container as SupportingFiles };

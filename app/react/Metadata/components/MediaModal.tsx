import React, { useMemo, useRef } from 'react';
import ReactModal from 'react-modal';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { get } from 'lodash';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { ClientFile, IStore } from 'app/istore';
import uniqueID from 'shared/uniqueID';
import { AttachmentSchema } from 'shared/types/commonTypes';
import { WebMediaResourceForm } from 'app/Attachments/components/WebMediaResourceForm';
import { uploadLocalAttachment } from 'app/Metadata/actions/supportingFilesActions';
import { mimeTypeFromUrl } from 'api/files/extensionHelper';
import { MediaModalFileList } from 'app/Metadata/components/MediaModalFileList';
import { MediaModalUploadFileButton } from './MediaModalUploadFileButton';
import { validImageFile, validMediaFile } from '../helpers/validator';

enum MediaModalType {
  Image,
  Media,
  All,
}

const getAcceptedFileTypes = (type: MediaModalType) => {
  switch (type) {
    case MediaModalType.Image:
      return 'image/*';
    case MediaModalType.Media:
      return 'video/*,audio/*';
    case MediaModalType.All:
    default:
      return '*/*';
  }
};

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: (AttachmentSchema | ClientFile)[];
  onChange: (id: any) => void;
  selectedUrl?: string;
  formModel: string;
  formField: string;
  type: MediaModalType;
  multipleEdition: boolean;
}

const mapStateToProps = (state: IStore, ownProps: MediaModalProps) => {
  const model = ownProps.formModel;
  return {
    entity: get(state, model),
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    { localAttachmentAction: uploadLocalAttachment, rrfChange: formActions.change },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = MediaModalProps & mappedProps;

function filterAttachments(
  type: MediaModalType | undefined,
  attachments: (AttachmentSchema | ClientFile)[]
) {
  const filteredAttachments = attachments.map(a => {
    const mimetype = a.url && !a.mimetype ? mimeTypeFromUrl(a.url) : a.mimetype;
    return { ...a, mimetype };
  });
  switch (type) {
    case MediaModalType.Image:
      return filteredAttachments.filter(validImageFile);
    case MediaModalType.Media:
      return filteredAttachments.filter(validMediaFile);
    default:
      return attachments;
  }
}

const MediaModalComponent = ({
  isOpen,
  attachments = [],
  selectedUrl,
  entity,
  formModel,
  formField,
  type,
  multipleEdition,
  onClose,
  onChange,
  localAttachmentAction,
  rrfChange,
}: ComponentProps) => {
  const filteredAttachments = useMemo(
    () => filterAttachments(type, attachments),
    [attachments, type]
  );

  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleAttachmentClick = (url: string) => () => {
    onChange(url);
    onClose();
  };

  const handleSubmitFromUrl = (formData: { url: string }) => {
    onChange(formData.url);
    onClose();
  };

  const handleFileInPublicForm = (event: React.FormEvent<HTMLInputElement>) => {
    const { files } = event.target as HTMLInputElement;
    if (files && files.length > 0) {
      const data = { data: URL.createObjectURL(files[0]), originalFile: files[0] };
      onChange(data);
      onClose();
    }
  };

  const handleUploadButtonClicked = () => {
    inputFileRef.current?.click();
  };

  const handleInputFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files || [];

    if (file) {
      const fileLocalID = uniqueID();

      localAttachmentAction(
        entity.sharedId || 'NEW_ENTITY',
        file,
        {
          __reducerKey: 'library',
          model: formModel,
        },
        fileLocalID
      );
      rrfChange(formField, fileLocalID);
      onClose();
    }
  };

  return (
    <ReactModal
      isOpen={isOpen}
      className="attachments-modal"
      overlayClassName="attachments-modal__overlay"
      ariaHideApp={false}
    >
      <div className="attachments-modal__header">
        <h4>
          <Translate>Supporting files</Translate>
        </h4>

        <button type="button" onClick={onClose} className="attachments-modal__close">
          <Icon icon="times" />
          <span>
            <Translate>Close</Translate>
          </span>
        </button>
      </div>
      <div className="attachments-modal__content">
        <div className="attachments-modal__tabs-content">
          <div className="upload-options">
            {!multipleEdition && (
              <MediaModalUploadFileButton
                formModel={formModel}
                acceptedFileTypes={getAcceptedFileTypes(type)}
                inputFileRef={inputFileRef}
                handleUploadButtonClicked={handleUploadButtonClicked}
                handleFileInPublicForm={handleFileInPublicForm}
                handleInputFileChange={handleInputFileChange}
              />
            )}
            {!multipleEdition && <Translate>or</Translate>}
            <div className="wrapper-web">
              <WebMediaResourceForm handleSubmit={handleSubmitFromUrl} />
            </div>
          </div>
          <div
            className={`tab-content attachments-modal__tabs-content ${
              !filteredAttachments.length ? 'centered' : ''
            }`}
          >
            <MediaModalFileList
              filteredAttachments={filteredAttachments}
              handleAttachmentClick={handleAttachmentClick}
              selectedUrl={selectedUrl || ''}
            />
          </div>
        </div>
      </div>
    </ReactModal>
  );
};

const container = connector(MediaModalComponent);

export type { MediaModalProps };
export { MediaModalType, container as MediaModal };

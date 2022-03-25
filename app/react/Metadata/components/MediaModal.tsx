import React, { useMemo, useRef } from 'react';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
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
import { PublicFormMediaField } from 'app/Forms/components/PublicFormMediaField';

enum MediaModalType {
  Image,
  Media,
}

enum MediaModalTab {
  SelectFromFile = 'SelectFromFile',
  AddNewFile = 'AddNewFile',
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: (AttachmentSchema | ClientFile)[];
  onChange: (id: any) => void;
  selectedUrl: string | null;
  formModel: string;
  formField: string;
  type?: MediaModalType;
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
    const mimetype = !a._id && a.url && !a.mimetype ? mimeTypeFromUrl(a.url) : a.mimetype;
    return { ...a, mimetype };
  });
  switch (type) {
    case MediaModalType.Image:
      return filteredAttachments.filter(a => a.mimetype && a.mimetype.includes('image'));
    case MediaModalType.Media:
      return filteredAttachments.filter(
        a => a.mimetype && (a.mimetype.includes('video') || a.mimetype.includes('audio'))
      );
    default:
      return attachments;
  }
}

const MediaModalComponent = ({
  isOpen,
  onClose,
  attachments = [],
  onChange,
  selectedUrl,
  entity,
  formModel,
  formField,
  type,
  localAttachmentAction,
  rrfChange,
}: ComponentProps) => {
  const filteredAttachments = useMemo(
    () => filterAttachments(type, attachments),
    [attachments, type]
  );

  const attachmentsUrls = useMemo(
    () => attachments.map(a => a.url || `/api/files/${a.filename}`),
    [attachments]
  );

  const defaultTab = useMemo(() => {
    if (!selectedUrl) {
      return MediaModalTab.SelectFromFile;
    }

    const selectedAttachmentIndex = attachmentsUrls.findIndex(url => url === selectedUrl);

    return selectedAttachmentIndex === -1 ? MediaModalTab.AddNewFile : MediaModalTab.SelectFromFile;
  }, [selectedUrl, attachments]);

  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const acceptedFileTypes = type === MediaModalType.Image ? 'image/*' : 'video/*';

  const handleAttachmentClick = (url: string) => () => {
    onChange(url);
    onClose();
  };

  const handleSubmitFromUrl = (formData: { url: string }) => {
    onChange(formData.url);
    onClose();
  };

  const handleFileInPublicForm = (formData: { file: string }) => {
    onChange(formData.file);
    onClose();
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
        <Tabs renderActiveTabContentOnly>
          <div className="attachments-modal__tabs">
            {formModel !== 'publicform' && (
              <TabLink
                to={MediaModalTab.SelectFromFile}
                className="tab-link modal-tab-1"
                default={defaultTab === MediaModalTab.SelectFromFile}
                component="div"
              >
                <Translate>Select from files</Translate>
              </TabLink>
            )}
            <TabLink
              to={MediaModalTab.AddNewFile}
              className="tab-link modal-tab-2"
              default={defaultTab === MediaModalTab.AddNewFile}
              component="div"
            >
              <Translate>Add new file</Translate>
            </TabLink>
          </div>

          <div className="attachments-modal__tabs-content">
            <TabContent
              for={MediaModalTab.SelectFromFile}
              className={`tab-content attachments-modal__tabs-content ${
                !filteredAttachments.length ? 'centered' : ''
              }`}
            >
              <MediaModalFileList
                filteredAttachments={filteredAttachments}
                handleAttachmentClick={handleAttachmentClick}
                selectedUrl={selectedUrl || ''}
              />
            </TabContent>
            <TabContent
              for={MediaModalTab.AddNewFile}
              className="tab-content attachments-modal__tabs-content centered"
            >
              {formModel === 'publicform' ? (
                <PublicFormMediaField handleSubmit={handleFileInPublicForm} file={selectedUrl} />
              ) : (
                <div className="upload-button">
                  <button
                    type="button"
                    onClick={handleUploadButtonClicked}
                    className="btn btn-success"
                  >
                    <Icon icon="link" />
                    &nbsp; <Translate>Upload and select file</Translate>
                  </button>
                  <input
                    aria-label="fileInput"
                    type="file"
                    onChange={handleInputFileChange}
                    style={{ display: 'none' }}
                    ref={inputFileRef}
                    accept={acceptedFileTypes}
                  />
                </div>
              )}

              <div className="wrapper-web">
                <WebMediaResourceForm
                  handleSubmit={handleSubmitFromUrl}
                  url={defaultTab === MediaModalTab.AddNewFile ? selectedUrl : ''}
                />
              </div>
            </TabContent>
          </div>
        </Tabs>
      </div>
    </ReactModal>
  );
};

const container = connector(MediaModalComponent);

export type { MediaModalProps };
export { MediaModalType, container as MediaModal };

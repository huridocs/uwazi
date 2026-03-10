import React, { useRef } from 'react';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import Dropzone from 'react-dropzone';
import { bindActionCreators, Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { WebMediaResourceForm } from 'app/Attachments/components/WebMediaResourceForm';

interface AttachmentsModalProps {
  isOpen: boolean;
  entitySharedId: string;
  storeKey: string;
  model: string;
  onClose(): void;
  uploadAttachment: (...args: any[]) => (dispatch: Dispatch<{}>) => Promise<any>;
  uploadAttachmentFromUrl: (...args: any[]) => (dispatch: Dispatch<{}>) => void;
  getPercentage?: number;
}

const AttachmentsModalCmp = ({
  isOpen,
  entitySharedId,
  storeKey,
  model,
  onClose,
  uploadAttachment: uploadAttachmentProp,
  uploadAttachmentFromUrl: uploadAttachmentFromUrlProp,
  getPercentage,
}: AttachmentsModalProps) => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  let formDispatch: Function = () => {};

  const handleUploadButtonClicked = () => {
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  };

  const handleInputFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await Promise.all(
        [...event.target.files].map(file =>
          uploadAttachmentProp(entitySharedId, file, { __reducerKey: storeKey, model })
        )
      );
    }
  };

  const handleDropFiles = async (accepted: File[]) => {
    await Promise.all(
      accepted.map(file =>
        uploadAttachmentProp(entitySharedId, file, { __reducerKey: storeKey, model })
      )
    );
  };

  const handleSubmitUrlForm = (formModelData: { url: string; name: string }) => {
    uploadAttachmentFromUrlProp(entitySharedId, formModelData, { __reducerKey: storeKey, model });
    formDispatch(formActions.reset('urlForm'));
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

        <button
          type="button"
          onClick={onClose}
          className="attachments-modal__close"
          disabled={getPercentage !== undefined}
        >
          <Icon icon="times" />
          <span>
            <Translate>Cancel</Translate>
          </span>
        </button>
      </div>
      <div className="attachments-modal__content">
        <Tabs renderActiveTabContentOnly>
          <div className="attachments-modal__tabs">
            <TabLink to="uploadComputer" className="tab-link modal-tab-1" component="div">
              <Translate>Upload from computer</Translate>
            </TabLink>
            <TabLink to="uploadWeb" className="tab-link modal-tab-2" component="div">
              <Translate>Add from web</Translate>
            </TabLink>
          </div>

          <div className="attachments-modal__tabs-content">
            <TabContent for="uploadComputer" className="tab-content centered">
              <Dropzone noClick onDrop={handleDropFiles} multiple={false}>
                {({ getRootProps }) => (
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  <div {...getRootProps()} className="attachments-modal__dropzone">
                    {getPercentage === undefined ? (
                      <>
                        <button type="button" onClick={handleUploadButtonClicked} className="btn">
                          <Icon icon="link" />
                          &nbsp; <Translate>Upload and select file</Translate>
                        </button>
                        <input
                          aria-label="fileInput"
                          type="file"
                          onChange={handleInputFileChange}
                          style={{ display: 'none' }}
                          ref={inputFileRef}
                        />
                        <h4 className="attachments-modal__dropzone-title">
                          <Translate>Drag and drop file in this window to upload</Translate>
                        </h4>
                      </>
                    ) : (
                      <div className="progress attachments-modal-progress">
                        <div
                          className="progress-bar progress-bar-success attachments-modal-progress-bar"
                          role="progressbar"
                          style={{ width: `${getPercentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Dropzone>
            </TabContent>
            <TabContent for="uploadWeb" className="tab-content centered">
              <div className="wrapper-web">
                <WebMediaResourceForm
                  handleSubmit={handleSubmitUrlForm}
                  dispatch={(dispatch: Function) => {
                    formDispatch = dispatch;
                  }}
                  hasName
                />
              </div>
            </TabContent>
          </div>
        </Tabs>
      </div>
    </ReactModal>
  );
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: AttachmentsModalProps) =>
  bindActionCreators(
    {
      uploadAttachment: ownProps.uploadAttachment,
      uploadAttachmentFromUrl: ownProps.uploadAttachmentFromUrl,
    },
    dispatch
  );

const AttachmentsModal = connect(null, mapDispatchToProps)(AttachmentsModalCmp);

export type { AttachmentsModalProps };
export { AttachmentsModalCmp, AttachmentsModal };

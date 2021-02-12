import React, { DragEvent, useRef } from 'react';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import Dropzone from 'react-dropzone';

import { Translate } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import { Icon } from 'app/UI';

import { uploadAttachment } from '../actions/actions';

interface AttachmentsModalProps {
  isOpen: boolean;
  entitySharedId: string;
  entityId: string;
  storeKey: string;
  onClose(): void;
  uploadAttachment(entity: any, file: any, __reducerKey: any, options?: {}): void;
  getPercentage?: number;
}

// eslint-disable-next-line react/prop-types
const AttachmentsModal: React.FC<AttachmentsModalProps> = ({
  isOpen,
  entitySharedId,
  storeKey,
  onClose,
  uploadAttachment,
  getPercentage,
}) => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadButtonClicked = () => {
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  };

  const handleInputFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      [...event.target.files].forEach(file => {
        uploadAttachment(entitySharedId, file, storeKey);
      });
    }
  };

  const handleDropFiles = (
    accepted: File[],
    rejected: File[],
    event: DragEvent<HTMLDivElement>
  ) => {
    accepted.forEach(file => {
      uploadAttachment(entitySharedId, file, storeKey);
    });
  };

  return (
    <NeedAuthorization roles={['admin', 'editor']}>
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
            <span>Cancel</span>
          </button>
        </div>
        <div className="attachments-modal__content">
          <Tabs renderActiveTabContentOnly>
            <div className="attachments-modal__tabs">
              <TabLink to="uploadComputer">
                <Translate>Upload from computer</Translate>
              </TabLink>
              <TabLink to="uploadWeb">
                <Translate>Add from web</Translate>
              </TabLink>
            </div>

            <div className="attachments-modal__tabs-content">
              <TabContent for="uploadComputer" className="tab-content centered">
                <Dropzone
                  disableClick
                  onDrop={handleDropFiles}
                  className="attachments-modal__dropzone"
                  multiple={false}
                >
                  {getPercentage === undefined ? (
                    <>
                      <button
                        type="button"
                        onClick={handleUploadButtonClicked}
                        className="btn btn-success"
                      >
                        <Icon icon="link" />
                        &nbsp; <Translate>Upload and select file</Translate>
                      </button>
                      <input
                        type="file"
                        onChange={handleInputFileChange}
                        style={{ display: 'none' }}
                        ref={inputFileRef}
                      />
                      <h4 className="attachments-modal__dropzone-title">
                        <Translate>Drag and drop file in this window to upload </Translate>
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
                </Dropzone>
              </TabContent>
              <TabContent for="uploadWeb" className="tab-content centered">
                <div className="wrapper-web">
                  <div className="form-group has-feedback">
                    <input type="text" className="form-control" placeholder="Paste URL here" />
                    <Icon icon="info-circle" class="feedback-icon" />
                  </div>

                  <input
                    type="text"
                    onChange={() => {}}
                    value=""
                    className="form-control"
                    placeholder="Title"
                  />

                  <button type="button" onClick={() => {}} className="btn btn-success">
                    <Icon icon="link" />
                    &nbsp; <Translate>Add resource</Translate>
                  </button>
                </div>
              </TabContent>
            </div>
          </Tabs>
        </div>
      </ReactModal>
    </NeedAuthorization>
  );
};

const mapDispatchToProps = {
  uploadAttachment,
};

export default connect(null, mapDispatchToProps)(AttachmentsModal);

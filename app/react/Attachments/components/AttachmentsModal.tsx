import React, { DragEvent, useRef } from 'react';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import Dropzone from 'react-dropzone';

import { Translate } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import { Icon } from 'app/UI';

import { uploadAttachment } from '../actions/actions';
import setReduxState from 'app/Library/helpers/setReduxState';

interface AttachmentsModalProps {
  isOpen: boolean;
  entity: string;
  storeKey: string;
  onClose(): void;
  uploadAttachment: (entity: any, file: any, __reducerKey: any, options?: {}) => void;
}

// eslint-disable-next-line react/prop-types
const AttachmentsModal: React.FC<AttachmentsModalProps> = ({
  isOpen,
  entity,
  storeKey,
  onClose,
  uploadAttachment,
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
        uploadAttachment(entity, file, storeKey);
      });
    }
  };

  const handleDropFiles = (
    accepted: File[],
    rejected: File[],
    event: DragEvent<HTMLDivElement>
  ) => {
    accepted.forEach(file => {
      uploadAttachment(entity, file, storeKey);
    });
  };

  return (
    <NeedAuthorization roles={['admin', 'editor']}>
      <ReactModal
        isOpen={isOpen}
        className="attachments-modal"
        overlayClassName="attachments-modal-overlay"
      >
        <div className="attachments-modal-header">
          <h4>
            <Translate>Supporting files</Translate>
          </h4>

          <button type="button" onClick={onClose} className="attachments-modal-close">
            <Icon icon="times" />
            <span>Cancel</span>
          </button>
        </div>
        <div className="attachments-modal-content">
          <Tabs renderActiveTabContentOnly>
            <div className="attachments-modal-tabs">
              <TabLink to="uploadComputer">
                <Translate>Upload from computer</Translate>
              </TabLink>
              <TabLink to="uploadWeb">
                <Translate>Add from web</Translate>
              </TabLink>
            </div>

            <div className="attachments-modal-tabs-content">
              <TabContent for="uploadComputer" className="tab-content centered">
                <Dropzone disableClick onDrop={handleDropFiles}>
                  <button
                    type="button"
                    onClick={handleUploadButtonClicked}
                    className="btn btn-success attachments-modal-file-triggger"
                  >
                    <Icon icon="link" />
                    &nbsp; <Translate>Upload and select file</Translate>
                  </button>
                  <input
                    type="file"
                    onChange={handleInputFileChange}
                    style={{ display: 'none' }}
                    ref={inputFileRef}
                    multiple
                  />
                  <Translate>Drag and drop file in this window to upload </Translate>
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

                  <button
                    type="button"
                    onClick={() => {}}
                    className="btn btn-success attachments-modal-file-triggger"
                  >
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

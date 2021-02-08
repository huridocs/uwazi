import React, { CSSProperties } from 'react';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';

import { NeedAuthorization } from 'app/Auth';
import { Icon } from 'app/UI';

interface AttachmentsModalProps {
  isOpen: boolean;
  onClose(): void;
}

// eslint-disable-next-line react/prop-types
const AttachmentsModal: React.FC<AttachmentsModalProps> = ({ isOpen, onClose }) => {
  return (
    <NeedAuthorization roles={['admin', 'editor']}>
      <ReactModal isOpen={isOpen} style={modalStyle}>
        <div className="attachments-modal-header">
          <h4>Supporting files</h4>

          <button type="button" onClick={onClose} className="attachments-modal-close">
            <Icon icon="times" />
            <span>Cancel</span>
          </button>
        </div>
        <div className="attachments-modal-content">
          <Tabs renderActiveTabContentOnly>
            <div className="attachments-modal-tabs">
              <TabLink to="uploadComputer">Upload from computer</TabLink>
              <TabLink to="uploadWeb">Add from web</TabLink>
            </div>

            <div className="attachments-modal-tabs-content">
              <TabContent for="uploadComputer" className="tab-content centered">
                <button
                  type="button"
                  onClick={() => {}}
                  className="btn btn-success attachments-modal-file-triggger"
                >
                  <Icon icon="link" />
                  &nbsp; Upload and select file
                </button>

                <span>Drag and drop file in this window to upload </span>
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
                    &nbsp; Add resource
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

const modalStyle = {
  overlay: {
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    width: '80vw',
    height: '70vh',
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

export default AttachmentsModal;

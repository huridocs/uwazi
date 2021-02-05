import React from 'react';
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
  const modalStyle = { overlay: { zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.5)' } };

  return (
    <NeedAuthorization roles={['admin', 'editor']}>
      <ReactModal isOpen={isOpen} style={modalStyle}>
        <div className="attachments-modal-header">
          <h4>Supporting files</h4>

          <button type="button" onClick={onClose}>
            <Icon icon="times" />
            Close Modal
          </button>
        </div>
        <div className="modal-content">
          <Tabs>
            <TabLink to="tab1">Tab1</TabLink>
            <TabLink to="tab2">Tab2</TabLink>

            <TabContent for="tab1">Tab 1</TabContent>
            <TabContent for="tab2">Tab 2</TabContent>
          </Tabs>
        </div>
      </ReactModal>
    </NeedAuthorization>
  );
};

export default AttachmentsModal;

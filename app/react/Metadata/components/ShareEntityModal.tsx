import Modal from 'app/Layout/Modal';
import React from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';

export interface ShareEntityModalProps {
  isOpen: boolean;
  onClose: (event: any) => void;
  onSave: (event: any) => void;
}

export const ShareEntityModalComponent = ({ isOpen, onClose, onSave }: ShareEntityModalProps) => (
  <Modal isOpen={isOpen} type="content">
    <Modal.Body>
      <div className="share-header">
        <Icon icon="user-plus" className="btn-success" />
        <h4>Share with people and groups</h4>
      </div>
    </Modal.Body>

    <Modal.Footer>
      <button type="button" className="btn btn-default cancel-button" onClick={onClose}>
        <Icon icon="times" />
        <Translate>Discard changes</Translate>
      </button>
      <button type="button" className="btn confirm-button btn-success" onClick={onSave}>
        <Icon icon="save" />
        <Translate>Save changes</Translate>
      </button>
    </Modal.Footer>
  </Modal>
);

export const ShareEntityModal = ShareEntityModalComponent;

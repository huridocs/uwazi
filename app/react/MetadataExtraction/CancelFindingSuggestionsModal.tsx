import React from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';

export interface CancelFindingSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const CancelFindingSuggestionModal = ({
  isOpen,
  onClose,
  onAccept,
}: CancelFindingSuggestionModalProps) => {
  return (
    <Modal isOpen={isOpen} type="content" className="suggestion-acceptance-modal">
      <Modal.Header>
        <h1>
          <Translate>Confirm</Translate>
        </h1>
      </Modal.Header>
      <Modal.Body>
        <Translate>This will cancel the finding suggestion process</Translate>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-default cancel-button"
          aria-label="Close acceptance modal"
          onClick={onClose}
        >
          <Translate>Cancel</Translate>
        </button>
        <button type="button" className="btn confirm-button btn-success" onClick={onAccept}>
          <Translate>Confirm</Translate>
        </button>
      </Modal.Footer>
    </Modal>
  );
};

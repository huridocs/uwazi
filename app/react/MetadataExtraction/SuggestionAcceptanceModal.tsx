import React, { useState } from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';

export interface SuggestionAcceptanceModalProps {
  isOpen: boolean;
  propertyType: string;
  onClose: () => void;
  onAccept: (allLanguages: boolean) => void;
}

export const SuggestionAcceptanceModal = ({
  isOpen,
  propertyType,
  onClose,
  onAccept,
}: SuggestionAcceptanceModalProps) => {
  const [allLanguages, setAllLanguages] = useState(true);
  return (
    <Modal isOpen={isOpen} type="content" className="suggestion-acceptance-modal">
      <Modal.Header>
        <h1>
          <Translate>Confirm suggestion acceptance</Translate>
        </h1>
      </Modal.Header>
      <Modal.Body>
        <label className="language-checkbox">
          {propertyType !== 'date' ? (
            <>
              <input
                type="checkbox"
                checked={allLanguages}
                onChange={e => setAllLanguages(e.target.checked)}
              />
              &nbsp;
              <Translate>Apply to all languages</Translate>
            </>
          ) : (
            <Translate>This will update the entity across all languages</Translate>
          )}
        </label>
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
        <button
          type="button"
          className="btn confirm-button btn-success"
          onClick={() => onAccept(allLanguages)}
        >
          <Translate>Confirm</Translate>
        </button>
      </Modal.Footer>
    </Modal>
  );
};

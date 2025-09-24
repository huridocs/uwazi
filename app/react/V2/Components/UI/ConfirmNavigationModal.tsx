import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { Button, Modal } from '.';

type confirmationModalType = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm?: () => void;
};

const ConfirmNavigationModal = ({
  setShowModal,
  onConfirm = () => undefined,
}: confirmationModalType) => (
  <Modal size="md">
    <Modal.Header>
      <h1 className="text-xl font-medium text-gray-900">
        <Translate>Discard changes?</Translate>
      </h1>
      <Modal.CloseButton onClick={() => setShowModal(false)} />
    </Modal.Header>
    <Modal.Body>
      <Translate>You have unsaved changes. Do you want to continue?</Translate>
    </Modal.Body>
    <Modal.Footer>
      <Button styling="light" onClick={() => setShowModal(false)} className="grow">
        <Translate>Cancel</Translate>
      </Button>
      <Button
        onClick={() => {
          setShowModal(false);
          onConfirm();
        }}
        className="grow"
      >
        <Translate>Discard changes</Translate>
      </Button>
    </Modal.Footer>
  </Modal>
);

export { ConfirmNavigationModal };

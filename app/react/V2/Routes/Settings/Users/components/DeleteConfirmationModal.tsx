import React from 'react';
import { Translate } from 'app/I18N';
import { SetterOrUpdater } from 'recoil';
import { Button, Modal } from 'V2/Components/UI';

type confirmationModalType = {
  setShowModal: SetterOrUpdater<boolean>;
  onConfirm?: () => void;
};

const DeleteConfirmationModal = ({
  setShowModal,
  onConfirm = () => undefined,
}: confirmationModalType) => (
  <Modal size="md">
    <Modal.Header>
      <h1 className="text-xl font-medium text-gray-900">
        <Translate>Delete</Translate>
      </h1>
      <Modal.CloseButton onClick={() => setShowModal(false)} />
    </Modal.Header>
    <Modal.Body>
      <Translate>Do you want to delete?</Translate>
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
        <Translate>Delete</Translate>
      </Button>
    </Modal.Footer>
  </Modal>
);

export { DeleteConfirmationModal };

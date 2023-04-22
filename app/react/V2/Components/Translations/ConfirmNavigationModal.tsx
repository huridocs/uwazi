import React from 'react';
import { Translate } from 'app/I18N';
import { SetterOrUpdater } from 'recoil';
import { Button, Modal } from '../UI';

type confirmationModalType = {
  setShowModal: SetterOrUpdater<boolean>;
  onComfirm?: () => void;
};

const ConfirmNavigationModal = ({
  setShowModal,
  onComfirm = () => undefined,
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
      <Button buttonStyle="tertiary" onClick={() => setShowModal(false)} className="grow">
        <Translate>Cancel</Translate>
      </Button>
      <Button
        onClick={() => {
          setShowModal(false);
          onComfirm();
        }}
        className="grow"
      >
        <Translate>Discard changes</Translate>
      </Button>
    </Modal.Footer>
  </Modal>
);

export { ConfirmNavigationModal };

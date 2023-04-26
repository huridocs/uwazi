import React from 'react';
import { Translate } from 'app/I18N';
import { SetterOrUpdater } from 'recoil';
import { NavigateFunction } from 'react-router-dom';
import { Button, Modal } from '../UI';

type confirmationModalType = {
  setShowModal: SetterOrUpdater<boolean>;
  navigate: NavigateFunction;
};

const ConfirmationModal = ({ setShowModal, navigate }: confirmationModalType) => (
  <>
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
      <Button
        onClick={() => {
          setShowModal(false);
          navigate('/settings/translations');
        }}
      >
        <Translate>Discard changes</Translate>
      </Button>
      <Button buttonStyle="tertiary" onClick={() => setShowModal(false)}>
        <Translate>Cancel</Translate>
      </Button>
    </Modal.Footer>
  </>
);

export { ConfirmationModal };

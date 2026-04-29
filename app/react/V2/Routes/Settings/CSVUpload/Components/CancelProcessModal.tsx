import React from 'react';
import { useRevalidator } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { cancel } from '#V2/api/csv/index.js';

type DropzoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entryId: string;
};

const CancelProcessModal = ({ isOpen, onClose, entryId }: DropzoneModalProps) => {
  const revalidator = useRevalidator();

  const handleClose = () => {
    onClose();
  };

  const handleCancel = async () => {
    await cancel(entryId);
    await revalidator.revalidate();
    handleClose();
  };

  return isOpen ? (
    <Modal size="xl">
      <Modal.Header>
        <Translate>Canceling</Translate>
        <Modal.CloseButton
          onClick={() => {
            handleClose();
          }}
        />
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-8">
          <Translate translationKey="cancel csv import">
            Cancel the import process. This will stop the creation of new entities. Already created
            entities will not be affected
          </Translate>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex gap-4 w-full">
          <Button
            className="w-1/2"
            variant="secondary"
            onClick={() => {
              handleClose();
            }}
          >
            <Translate>Close</Translate>
          </Button>
          <Button className="w-1/2" variant="danger" onClick={handleCancel}>
            <Translate>Cancel</Translate>
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  ) : (
    <div />
  );
};

export { CancelProcessModal };

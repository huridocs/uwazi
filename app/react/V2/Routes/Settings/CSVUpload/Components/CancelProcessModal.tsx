import React from 'react';
import { useRevalidator } from 'react-router';
import { Translate, t } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { cancel, CsvImportStatus } from '#V2/api/csv/index.js';
import { useRequestStatus, requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import { statusMessages } from './statusMessages.js';
import { getStore } from '#shared/atomStore/index.js';
import { buildTaskLabel, fileNameFromTaskLabel } from '../csvImportTaskProgress.js';

type DropzoneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entryId: string;
};

const CancelProcessModal = ({ isOpen, onClose, entryId }: DropzoneModalProps) => {
  const revalidator = useRevalidator();
  const { updateTask, endTask, notify } = useRequestStatus();

  const handleClose = () => {
    onClose();
  };

  const handleCancel = async () => {
    const response = await cancel(entryId);
    if ('cancelled' in response && response.cancelled) {
      const existingLabel = getStore()
        .get(requestStatusAtom)
        .tasks.find(task => task.id === entryId)?.label;
      const fileName = fileNameFromTaskLabel(existingLabel);
      updateTask(entryId, {
        label: buildTaskLabel(statusMessages[CsvImportStatus.Cancelled].title, fileName),
      });
      endTask(entryId, 'completed');
      notify('info', t('System', 'CSV import cancelled', null, false), fileName);
    }
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

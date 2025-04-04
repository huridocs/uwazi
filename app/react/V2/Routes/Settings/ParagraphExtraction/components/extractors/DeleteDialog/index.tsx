import React, { useState } from 'react';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal } from 'V2/Components/UI';
import { notificationAtom } from 'V2/atoms';
import { dialogConfig } from './config';
import { PXTable } from '../../../types';

const {
  service,
  headerText,
  warningText,
  acceptButtonText,
  cancelButtonText,
  successText,
  errorText,
} = dialogConfig;

const DeleteDialog = ({
  setIsProcessing,
  onSuccess,
  selected,
}: {
  setIsProcessing: (value: boolean) => void;
  selected: PXTable[];
  onSuccess: () => void;
}) => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsProcessing(true);

    try {
      await service(selected);
      await revalidator.revalidate();
      setIsOpen(false);
      setNotifications({
        type: 'success',
        text: <Translate>{successText}</Translate>,
      });
      onSuccess();
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>{errorText}</Translate>,
      });
    }

    setIsOpen(false);
    setIsProcessing(false);
  };

  return (
    <>
      <Button color="error" type="button" onClick={() => setIsOpen(true)}>
        <Translate>Delete</Translate>
      </Button>
      {isOpen && (
        <ConfirmationModal
          header={<Translate>{headerText}</Translate>}
          warningText={<Translate>{warningText}</Translate>}
          acceptButton={<Translate>{acceptButtonText}</Translate>}
          cancelButton={<Translate>{cancelButtonText}</Translate>}
          onAcceptClick={handleDelete}
          onCancelClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export { DeleteDialog };

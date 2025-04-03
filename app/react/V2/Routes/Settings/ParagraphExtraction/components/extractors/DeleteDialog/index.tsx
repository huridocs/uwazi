import React from 'react';
import { Translate } from 'app/I18N';
import { ConfirmationModal } from 'app/V2/Components/UI';
import { useRevalidator } from 'react-router';
import { notificationAtom } from 'app/V2/atoms';
import { useSetAtom } from 'jotai';
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
  isOpen = false,
  setIsOpen = () => {},
}: {
  setIsProcessing: (value: boolean) => void;
  selected: PXTable[];
  onSuccess: () => void;
  isOpen?: boolean;
  setIsOpen?: (value: boolean) => void;
}) => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);

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

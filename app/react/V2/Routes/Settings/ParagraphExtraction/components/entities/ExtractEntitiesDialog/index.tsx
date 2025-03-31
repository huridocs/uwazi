import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal } from 'app/V2/Components/UI';
import { useRevalidator, useParams } from 'react-router';
import { notificationAtom } from 'app/V2/atoms';
import { useSetAtom } from 'jotai';
import { dialogConfig } from './config';
import { PXEntityTable } from '../../../types';

const {
  service,
  headerText,
  warningText,
  acceptButtonText,
  cancelButtonText,
  successText,
  errorText,
} = dialogConfig;

const ExtractEntitiesDialog = ({
  setIsProcessing,
  disabled,
  onSuccess,
  selected,
}: {
  setIsProcessing: (value: boolean) => void;
  disabled: boolean;
  onSuccess: () => void;
  selected: PXEntityTable[];
}) => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const { extractorId = '' } = useParams();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsProcessing(true);

    try {
      await service(extractorId, selected);
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
      <Button
        type="button"
        className="disabled:opacity-50"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        <Translate>Extract paragraphs</Translate>
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

export { ExtractEntitiesDialog };

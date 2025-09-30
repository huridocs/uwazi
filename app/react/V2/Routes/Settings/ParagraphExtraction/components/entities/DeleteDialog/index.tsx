import React, { useState } from 'react';
import { useSetAtom } from 'jotai';
import { useRevalidator } from 'react-router';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal } from 'V2/Components/UI';
import { TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { notificationAtom } from 'V2/atoms';
import * as entitiesAPI from 'V2/api/paragraphExtractor/entities';
import { handleUnexpectedError } from 'app/V2/shared/errorUtils';

const DeleteDialog = ({
  setIsProcessing,
  onSuccess,
  selected,
  disabled,
}: {
  setIsProcessing: (value: boolean) => void;
  selected: TablePXEntityRow[];
  onSuccess: () => void;
  disabled: boolean;
}) => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsProcessing(true);

    try {
      await entitiesAPI.remove(selected);
      await revalidator.revalidate();
      setIsOpen(false);
      setNotifications({
        type: 'success',
        text: <Translate>Paragraphs deleted</Translate>,
      });
      onSuccess();
    } catch (error) {
      handleUnexpectedError(error, 'Error deleting paragraphs');
    }

    setIsOpen(false);
    setIsProcessing(false);
  };

  return (
    <>
      <Button color="error" type="button" onClick={() => setIsOpen(true)} disabled={disabled}>
        <Translate>Delete</Translate>
      </Button>
      {isOpen && (
        <ConfirmationModal
          header={<Translate>Are you sure?</Translate>}
          warningText={<Translate>All of the paragraphs will be deleted</Translate>}
          acceptButton={<Translate>Delete</Translate>}
          cancelButton={<Translate>No, cancel</Translate>}
          onAcceptClick={handleDelete}
          onCancelClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export { DeleteDialog };

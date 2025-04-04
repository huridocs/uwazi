import React, { useState } from 'react';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal } from 'V2/Components/UI';
import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';
import { notificationAtom } from 'V2/atoms';
import { PXTable } from '../../../types';

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
      await extractorsAPI.remove(selected);
      await revalidator.revalidate();
      setIsOpen(false);
      setNotifications({
        type: 'success',
        text: <Translate>Extractor/s deleted</Translate>,
      });
      onSuccess();
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
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
          header={<Translate>Are you sure?</Translate>}
          warningText={
            <Translate>
              Only the extractor will be deleted, all created entities will remain on the library.
            </Translate>
          }
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

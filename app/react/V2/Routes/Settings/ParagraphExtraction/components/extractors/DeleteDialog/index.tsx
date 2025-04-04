import React from 'react';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { ConfirmationModal } from 'V2/Components/UI';
import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';
import { notificationAtom } from 'V2/atoms';
import { PXTable } from '../../../types';

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

import React from 'react';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { ConfirmationModal } from '#V2/Components/UI/index.js';
import * as extractorsAPI from '#V2/api/paragraphExtractor/extractors.js';
import { notificationAtom } from '#V2/atoms/index.js';
import { PXTable } from '#V2/Routes/Settings/ParagraphExtraction/types.js';

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

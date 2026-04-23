import React from 'react';
import { useRevalidator } from 'react-router';
import { t, Translate } from '#app/I18N/index.js';
import { ConfirmationModal } from '#V2/Components/UI/index.js';
import * as extractorsAPI from '#V2/api/paragraphExtractor/extractors.js';
import { PXTable } from '../../../types.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

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
  const { notify } = useRequestStatus();

  const handleDelete = async () => {
    setIsProcessing(true);

    try {
      await extractorsAPI.remove(selected);
      await revalidator.revalidate();
      setIsOpen(false);
      notify('success', t('System', 'Extractor/s deleted', null, false));
      onSuccess();
    } catch (error) {
      notify('error', t('System', 'An error occurred', null, false));
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

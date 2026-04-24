import React, { useState } from 'react';
import { useRevalidator } from 'react-router';
import { t, Translate } from '#app/I18N/index.js';
import { Button, ConfirmationModal } from '#V2/Components/UI/index.js';
import { TablePXEntityRow } from '#V2/shared/ParagraphExtractionTypes.js';
import * as entitiesAPI from '#V2/api/paragraphExtractor/entities.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

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
  const { notify } = useRequestStatus();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsProcessing(true);

    try {
      await entitiesAPI.remove(selected);
      await revalidator.revalidate();
      setIsOpen(false);
      notify('success', t('System', 'Paragraphs deleted', null, false));
      onSuccess();
    } catch (error) {
      notify('error', t('System', 'An error occurred', null, false));
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

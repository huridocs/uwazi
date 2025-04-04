import React, { useState } from 'react';
import { useRevalidator, useLoaderData } from 'react-router';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal } from 'V2/Components/UI';
import { notificationAtom } from 'V2/atoms';
import { PXEntityLoaderResponse, TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { dialogConfig } from './config';

const {
  service,
  headerText,
  warningText,
  acceptButtonText,
  cancelButtonText,
  successText,
  errorText,
  details,
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
  selected: TablePXEntityRow[];
}) => {
  const { extractor } = useLoaderData() as PXEntityLoaderResponse;
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const [isOpen, setIsOpen] = useState(false);

  // eslint-disable-next-line max-statements
  const handleExtract = async () => {
    setIsProcessing(true);

    try {
      if (!extractor) {
        setNotifications({
          type: 'error',
          text: <Translate>{errorText}</Translate>,
          details: <Translate>{details}</Translate>,
        });
      } else {
        await service(extractor?._id, selected);
        await revalidator.revalidate();
        setIsOpen(false);
        setNotifications({
          type: 'success',
          text: <Translate>{successText}</Translate>,
        });
        onSuccess();
      }
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
          onAcceptClick={handleExtract}
          onCancelClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export { ExtractEntitiesDialog };

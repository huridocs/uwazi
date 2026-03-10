import React, { useState } from 'react';
import { useRevalidator, useLoaderData } from 'react-router';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import * as entitiesAPI from 'V2/api/paragraphExtractor/entities';
import { Button, ConfirmationModal } from 'V2/Components/UI';
import { notificationAtom } from 'V2/atoms';
import { PXEntityLoaderResponse, TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { handleUnexpectedError } from 'app/V2/shared/errorUtils';

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
          text: <Translate>An error occurred</Translate>,
          details: <Translate>Cannot find extractor</Translate>,
        });
      } else {
        await entitiesAPI.extractSelected(extractor?._id, selected);
        await revalidator.revalidate();
        setIsOpen(false);
        setNotifications({
          type: 'success',
          text: (
            <Translate>
              The process of extracting the paragraphs has successfully started. Check the Status
              column for updates on the process.
            </Translate>
          ),
        });
        onSuccess();
      }
    } catch (error) {
      handleUnexpectedError(error, 'Error extracting paragraphs');
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
          header={<Translate>Are you sure?</Translate>}
          warningText={
            <Translate>
              All of the previously created paragraphs will be deleted and recreated after the
              process.
            </Translate>
          }
          acceptButton={<Translate>Continue</Translate>}
          cancelButton={<Translate>No, cancel</Translate>}
          onAcceptClick={handleExtract}
          onCancelClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export { ExtractEntitiesDialog };
